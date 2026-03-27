from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from model import CATEGORICAL_FEATURES, NUMERIC_FEATURES, CreditScoringArtifacts, CreditScoringModel


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train CreditXplain model on real dataset")
    parser.add_argument("--data", required=True, help="Path to CSV data file")
    parser.add_argument("--target", default="defaultRisk", help="Target label column name (1=default risk)")
    parser.add_argument(
        "--column-map",
        default="",
        help="Optional JSON file mapping your column names to app schema feature names",
    )
    parser.add_argument("--test-size", type=float, default=0.2)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def load_column_map(path: str) -> Dict[str, str]:
    if not path:
        return {}
    map_path = Path(path)
    if not map_path.exists():
        raise FileNotFoundError(f"Column map not found: {path}")
    return json.loads(map_path.read_text(encoding="utf-8"))


def prepare_dataframe(df: pd.DataFrame, target: str, column_map: Dict[str, str]) -> pd.DataFrame:
    if column_map:
        df = df.rename(columns=column_map)

    base_numeric = [
        "age",
        "income",
        "employmentYears",
        "loanAmount",
        "existingDebts",
        "creditHistory",
        "numberOfDependents",
        "monthlyExpenses",
        "savingsBalance",
    ]

    required = set(base_numeric + CATEGORICAL_FEATURES + [target])
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise ValueError(
            "Dataset missing required columns: "
            + ", ".join(missing)
            + "\nProvide --column-map to map your dataset fields to app schema."
        )

    # Create engineered features expected by model schema.
    safe_income = pd.to_numeric(df["income"], errors="coerce").fillna(0).clip(lower=1)
    safe_monthly_income = (safe_income / 12.0).clip(lower=1)
    debts = pd.to_numeric(df["existingDebts"], errors="coerce").fillna(0)
    loan = pd.to_numeric(df["loanAmount"], errors="coerce").fillna(0)
    savings = pd.to_numeric(df["savingsBalance"], errors="coerce").fillna(0)
    monthly_expenses = pd.to_numeric(df["monthlyExpenses"], errors="coerce").fillna(0)

    df["debtToIncomeRatio"] = (debts + (loan / 60.0)) / safe_monthly_income
    df["loanToIncomeRatio"] = loan / safe_income
    df["savingsToIncomeRatio"] = savings / safe_income
    df["netMonthlyCashflow"] = safe_monthly_income - monthly_expenses - debts

    # Keep only relevant features + target.
    trimmed = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES + [target]].copy()

    for col in NUMERIC_FEATURES:
        trimmed[col] = pd.to_numeric(trimmed[col], errors="coerce").fillna(0.0)

    for col in CATEGORICAL_FEATURES:
        trimmed[col] = trimmed[col].fillna("other").astype(str)

    trimmed[target] = pd.to_numeric(trimmed[target], errors="coerce").fillna(0).astype(int)
    trimmed[target] = trimmed[target].clip(0, 1)
    return trimmed


def make_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def candidate_models(seed: int) -> Dict[str, object]:
    return {
        "logistic_regression": LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            random_state=seed,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=500,
            max_depth=20,
            min_samples_leaf=5,
            class_weight="balanced_subsample",
            random_state=seed,
            n_jobs=-1,
        ),
        "gradient_boosting": GradientBoostingClassifier(random_state=seed),
    }


def evaluate_model(y_true: np.ndarray, prob: np.ndarray, pred: np.ndarray) -> Dict[str, float]:
    return {
        "roc_auc": float(roc_auc_score(y_true, prob)),
        "pr_auc": float(average_precision_score(y_true, prob)),
        "brier": float(brier_score_loss(y_true, prob)),
        "accuracy": float(accuracy_score(y_true, pred)),
        "precision": float(precision_score(y_true, pred, zero_division=0)),
        "recall": float(recall_score(y_true, pred, zero_division=0)),
        "f1": float(f1_score(y_true, pred, zero_division=0)),
    }


def train_best_model(df: pd.DataFrame, target: str, seed: int, test_size: float) -> Tuple[Pipeline, Dict[str, Dict[str, float]], pd.DataFrame, pd.Series]:
    X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=seed,
        stratify=y,
    )

    base_prep = make_preprocessor()
    scores: Dict[str, Dict[str, float]] = {}
    trained: Dict[str, Pipeline] = {}

    for name, estimator in candidate_models(seed).items():
        pipe = Pipeline(steps=[("prep", clone(base_prep)), ("clf", estimator)])
        pipe.fit(X_train, y_train)

        prob = pipe.predict_proba(X_test)[:, 1]
        pred = (prob >= 0.5).astype(int)
        scores[name] = evaluate_model(y_test.to_numpy(), prob, pred)
        trained[name] = pipe

    # Prioritize ROC AUC, then PR AUC, then lower Brier.
    best_name = sorted(
        scores.keys(),
        key=lambda k: (scores[k]["roc_auc"], scores[k]["pr_auc"], -scores[k]["brier"]),
        reverse=True,
    )[0]

    return trained[best_name], scores, X_train, y_train


def main() -> None:
    args = parse_args()

    source = Path(args.data)
    if not source.exists():
        raise FileNotFoundError(f"Dataset not found: {source}")

    if source.suffix.lower() in {".xlsx", ".xls"}:
        raw = pd.read_excel(source)
    else:
        raw = pd.read_csv(source)

    col_map = load_column_map(args.column_map)
    df = prepare_dataframe(raw, target=args.target, column_map=col_map)

    best_risk_model, score_table, X_train, y_train = train_best_model(
        df,
        target=args.target,
        seed=args.seed,
        test_size=args.test_size,
    )

    # Keep logistic model as explanation model for stable directional feature attribution.
    explain_model = Pipeline(
        steps=[
            ("prep", make_preprocessor()),
            (
                "clf",
                LogisticRegression(
                    max_iter=2000,
                    class_weight="balanced",
                    random_state=args.seed,
                ),
            ),
        ]
    )
    explain_model.fit(X_train, y_train)

    artifacts = CreditScoringArtifacts(
        risk_model=best_risk_model,
        explain_model=explain_model,
        baseline_score=650.0,
    )

    model = CreditScoringModel(artifacts)
    artifact_dir = Path(__file__).parent / "artifacts"
    artifact_dir.mkdir(parents=True, exist_ok=True)

    model_path = artifact_dir / "credit_model.joblib"
    report_path = artifact_dir / "training_report.json"

    model.save(str(model_path))

    best_name = max(score_table.keys(), key=lambda k: score_table[k]["roc_auc"])
    report = {
        "dataset": str(source),
        "rows": int(len(df)),
        "target": args.target,
        "best_model": best_name,
        "metrics": score_table,
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Saved model: {model_path}")
    print(f"Saved report: {report_path}")
    print("Model comparison metrics:")
    print(json.dumps(score_table, indent=2))


if __name__ == "__main__":
    main()
