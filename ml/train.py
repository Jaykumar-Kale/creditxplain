from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from model import CreditScoringModel


def generate_training_data(size: int = 12000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    df = pd.DataFrame(
        {
            "age": rng.integers(21, 66, size=size),
            "income": rng.normal(850000, 350000, size=size).clip(180000, 4500000),
            "employmentYears": rng.integers(0, 31, size=size),
            "loanAmount": rng.normal(550000, 300000, size=size).clip(50000, 3000000),
            "existingDebts": rng.normal(12000, 8000, size=size).clip(0, 90000),
            "creditHistory": rng.normal(6.2, 2.0, size=size).clip(0, 10),
            "numberOfDependents": rng.integers(0, 6, size=size),
            "monthlyExpenses": rng.normal(28000, 12000, size=size).clip(5000, 180000),
            "savingsBalance": rng.normal(180000, 160000, size=size).clip(0, 2500000),
            "educationLevel": rng.choice(["high_school", "bachelor", "master", "phd", "other"], size=size, p=[0.25, 0.42, 0.20, 0.03, 0.10]),
            "maritalStatus": rng.choice(["single", "married", "divorced", "widowed"], size=size, p=[0.42, 0.46, 0.09, 0.03]),
            "homeOwnership": rng.choice(["own", "rent", "mortgage", "other"], size=size, p=[0.22, 0.44, 0.29, 0.05]),
            "loanPurpose": rng.choice(["home", "car", "education", "business", "medical", "personal", "other"], size=size),
        }
    )

    df["debtToIncomeRatio"] = (df["existingDebts"] + (df["loanAmount"] / 60.0)) / (df["income"] / 12.0)
    df["loanToIncomeRatio"] = df["loanAmount"] / df["income"]
    df["savingsToIncomeRatio"] = df["savingsBalance"] / df["income"]
    df["netMonthlyCashflow"] = (df["income"] / 12.0) - df["monthlyExpenses"] - df["existingDebts"]

    # Risk signal engineered from affordability + history + stability.
    risk_signal = (
        1.5 * df["debtToIncomeRatio"]
        + 0.5 * df["loanToIncomeRatio"]
        - 0.35 * df["employmentYears"] / 10.0
        - 0.9 * df["creditHistory"] / 10.0
        - 0.3 * df["savingsToIncomeRatio"]
        - 0.25 * np.clip(df["netMonthlyCashflow"] / 50000.0, -2.0, 2.0)
        + rng.normal(0, 0.25, size=size)
    )

    # Default risk label: 1 means high default risk.
    threshold = np.quantile(risk_signal, 0.58)
    df["defaultRisk"] = (risk_signal > threshold).astype(int)

    return df


def main() -> None:
    data = generate_training_data()
    model = CreditScoringModel.train(data)

    artifact_dir = Path(__file__).parent / "artifacts"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    model_path = artifact_dir / "credit_model.joblib"

    model.save(str(model_path))
    print(f"Saved model to {model_path}")


if __name__ == "__main__":
    main()
