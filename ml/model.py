from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer


NUMERIC_FEATURES = [
    "age",
    "income",
    "employmentYears",
    "loanAmount",
    "existingDebts",
    "creditHistory",
    "numberOfDependents",
    "monthlyExpenses",
    "savingsBalance",
    "debtToIncomeRatio",
    "loanToIncomeRatio",
    "savingsToIncomeRatio",
    "netMonthlyCashflow",
]

CATEGORICAL_FEATURES = [
    "educationLevel",
    "maritalStatus",
    "homeOwnership",
    "loanPurpose",
]


@dataclass
class CreditScoringArtifacts:
    risk_model: Pipeline
    explain_model: Pipeline
    baseline_score: float


class CreditScoringModel:
    def __init__(self, artifacts: CreditScoringArtifacts) -> None:
        self.artifacts = artifacts

    @staticmethod
    def _feature_frame(payload: Dict[str, Any]) -> pd.DataFrame:
        income = max(float(payload.get("income", 0.0)), 1.0)
        monthly_income = income / 12.0
        existing_debts = float(payload.get("existingDebts", 0.0))
        loan_amount = float(payload.get("loanAmount", 0.0))
        monthly_expenses = float(payload.get("monthlyExpenses", 0.0))
        savings_balance = float(payload.get("savingsBalance", 0.0))

        engineered = {
            **payload,
            "debtToIncomeRatio": (existing_debts + (loan_amount / 60.0)) / max(monthly_income, 1.0),
            "loanToIncomeRatio": loan_amount / income,
            "savingsToIncomeRatio": savings_balance / income,
            "netMonthlyCashflow": monthly_income - monthly_expenses - existing_debts,
        }
        frame = pd.DataFrame([engineered])

        for col in NUMERIC_FEATURES:
            frame[col] = pd.to_numeric(frame.get(col, 0), errors="coerce").fillna(0)
        for col in CATEGORICAL_FEATURES:
            frame[col] = frame.get(col, "other").fillna("other").astype(str)

        return frame

    @staticmethod
    def train(training_df: pd.DataFrame) -> "CreditScoringModel":
        X = training_df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
        y = training_df["defaultRisk"]

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), NUMERIC_FEATURES),
                ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ]
        )

        risk_model = Pipeline(
            steps=[
                ("prep", preprocessor),
                ("clf", GradientBoostingClassifier(random_state=42)),
            ]
        )

        explain_model = Pipeline(
            steps=[
                ("prep", preprocessor),
                ("clf", LogisticRegression(max_iter=1000, random_state=42)),
            ]
        )

        X_train, X_test, y_train, _ = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        risk_model.fit(X_train, y_train)
        explain_model.fit(X_train, y_train)

        baseline_score = float(650)
        return CreditScoringModel(
            CreditScoringArtifacts(
                risk_model=risk_model,
                explain_model=explain_model,
                baseline_score=baseline_score,
            )
        )

    def score(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        x = self._feature_frame(payload)

        default_probability = float(self.artifacts.risk_model.predict_proba(x)[0, 1])
        approval_probability = 1.0 - default_probability

        credit_score = int(round(np.clip(300 + approval_probability * 550, 300, 850)))

        if credit_score >= 750:
            decision = "approved"
            risk_level = "low"
            interest_rate_range = "6.5% - 8.5%"
            max_approved_amount = min(float(payload.get("loanAmount", 0)), float(payload.get("income", 0)) * 5)
        elif credit_score >= 650:
            decision = "approved"
            risk_level = "medium"
            interest_rate_range = "9% - 13%"
            max_approved_amount = min(float(payload.get("loanAmount", 0)), float(payload.get("income", 0)) * 3)
        elif credit_score >= 580:
            decision = "review"
            risk_level = "high"
            interest_rate_range = "14% - 18%"
            max_approved_amount = min(float(payload.get("loanAmount", 0)) * 0.6, float(payload.get("income", 0)) * 2)
        else:
            decision = "rejected"
            risk_level = "very_high"
            interest_rate_range = "N/A"
            max_approved_amount = 0.0

        explanations = self._local_explanations(x, payload)
        recommendation = self._recommendation(decision, explanations)

        what_if = self._what_if_scenarios(payload, credit_score)

        return {
            "creditScore": credit_score,
            "decision": decision,
            "riskLevel": risk_level,
            "probability": round(approval_probability, 4),
            "explanations": explanations,
            "recommendation": recommendation,
            "interestRateRange": interest_rate_range,
            "maxApprovedAmount": int(round(max_approved_amount)),
            "whatIfScenarios": what_if,
            "modelMetadata": {
                "riskModel": "GradientBoostingClassifier",
                "explainabilityModel": "LogisticRegression",
            },
        }

    def _local_explanations(self, x: pd.DataFrame, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        transformed = self.artifacts.explain_model.named_steps["prep"].transform(x)
        coeffs = self.artifacts.explain_model.named_steps["clf"].coef_[0]

        if hasattr(transformed, "toarray"):
            values = transformed.toarray()[0]
        else:
            values = np.asarray(transformed)[0]

        contributions = values * coeffs
        top_idx = np.argsort(np.abs(contributions))[::-1][:6]

        feature_names = self.artifacts.explain_model.named_steps["prep"].get_feature_names_out()

        friendly = []
        for idx in top_idx:
            feature_name = str(feature_names[idx])
            impact_value = float(contributions[idx])
            direction = "positive" if impact_value >= 0 else "negative"
            friendly.append(
                {
                    "factor": self._human_factor(feature_name),
                    "impact": self._impact_sentence(feature_name, payload),
                    "direction": direction,
                    "weight": int(round(min(abs(impact_value) * 100, 35))),
                    "rawValue": round(impact_value, 4),
                }
            )

        return friendly

    def _what_if_scenarios(self, payload: Dict[str, Any], current_score: int) -> List[Dict[str, Any]]:
        scenarios: List[Tuple[str, Dict[str, Any]]] = [
            (
                "If you improved credit history by 2 points",
                {**payload, "creditHistory": min(float(payload.get("creditHistory", 0)) + 2, 10)},
            ),
            (
                "If you reduced existing debts by 30%",
                {**payload, "existingDebts": float(payload.get("existingDebts", 0)) * 0.7},
            ),
            (
                "If you increased savings by 50%",
                {**payload, "savingsBalance": float(payload.get("savingsBalance", 0)) * 1.5},
            ),
            (
                "If you requested 30% less loan amount",
                {**payload, "loanAmount": float(payload.get("loanAmount", 0)) * 0.7},
            ),
        ]

        output = []
        for label, scenario_payload in scenarios:
            scenario_x = self._feature_frame(scenario_payload)
            default_probability = float(self.artifacts.risk_model.predict_proba(scenario_x)[0, 1])
            scenario_score = int(round(np.clip(300 + (1.0 - default_probability) * 550, 300, 850)))
            output.append(
                {
                    "scenario": label,
                    "newScore": scenario_score,
                    "change": scenario_score - current_score,
                }
            )
        return output

    @staticmethod
    def _human_factor(feature_name: str) -> str:
        text = feature_name
        if "debtToIncomeRatio" in text:
            return "Debt-to-Income Ratio"
        if "loanToIncomeRatio" in text:
            return "Loan-to-Income Ratio"
        if "savingsToIncomeRatio" in text:
            return "Savings-to-Income Ratio"
        if "creditHistory" in text:
            return "Credit History"
        if "employmentYears" in text:
            return "Employment Stability"
        if "income" in text and "loan" not in text:
            return "Income"
        return text.replace("num__", "").replace("cat__", "").replace("_", " ").title()

    @staticmethod
    def _impact_sentence(feature_name: str, payload: Dict[str, Any]) -> str:
        if "creditHistory" in feature_name:
            return f"Credit history score is {payload.get('creditHistory', 0)}/10."
        if "debtToIncomeRatio" in feature_name:
            return "Debt-to-income ratio is a strong driver of repayment capacity."
        if "loanToIncomeRatio" in feature_name:
            return "Requested loan amount relative to income affects affordability."
        if "employmentYears" in feature_name:
            return f"Employment tenure is {payload.get('employmentYears', 0)} years."
        if "savingsToIncomeRatio" in feature_name:
            return "Savings buffer improves resilience during repayment."
        return "This feature materially influenced the model output."

    @staticmethod
    def _recommendation(decision: str, explanations: List[Dict[str, Any]]) -> str:
        weak = [e["factor"] for e in explanations if e["direction"] == "negative"]
        if decision == "approved":
            return "Approved. Maintain low debt burden and timely repayment behavior to preserve this score."
        if decision == "review":
            if weak:
                return f"Manual review required. Improve {', '.join(weak[:2])} to increase approval confidence."
            return "Manual review required. Strengthen affordability and repayment indicators."
        if weak:
            return f"Not approved. Improve {', '.join(weak[:2])}, then re-apply with lower debt obligations."
        return "Not approved. Improve repayment profile and financial stability before reapplying."

    def save(self, path: str) -> None:
        joblib.dump(self.artifacts, path)

    @classmethod
    def load(cls, path: str) -> "CreditScoringModel":
        artifacts: CreditScoringArtifacts = joblib.load(path)
        return cls(artifacts)
