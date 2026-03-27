from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from model import CreditScoringModel
from train import main as train_model


class ScoreInput(BaseModel):
    age: float = Field(..., ge=18, le=100)
    income: float = Field(..., gt=0)
    employmentYears: float = Field(..., ge=0)
    loanAmount: float = Field(..., gt=0)
    loanPurpose: str
    existingDebts: float = Field(default=0, ge=0)
    creditHistory: float = Field(..., ge=0, le=10)
    numberOfDependents: float = Field(default=0, ge=0)
    educationLevel: str = Field(default="other")
    maritalStatus: str = Field(default="single")
    homeOwnership: str = Field(default="other")
    monthlyExpenses: float = Field(..., ge=0)
    savingsBalance: float = Field(default=0, ge=0)
    gender: str = Field(default="prefer_not_to_say")


app = FastAPI(title="CreditXplain ML Service", version="1.0.0")

MODEL_PATH = Path(__file__).parent / "artifacts" / "credit_model.joblib"
model: CreditScoringModel | None = None


@app.on_event("startup")
def startup() -> None:
    global model

    if not MODEL_PATH.exists():
        train_model()

    model = CreditScoringModel.load(str(MODEL_PATH))


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "modelLoaded": model is not None,
        "artifact": str(MODEL_PATH),
    }


@app.post("/score")
def score(payload: ScoreInput) -> Dict[str, Any]:
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        result = model.score(payload.model_dump())
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(exc)}") from exc


@app.post("/train")
def train_endpoint() -> Dict[str, Any]:
    global model

    train_model()
    model = CreditScoringModel.load(str(MODEL_PATH))
    return {"status": "ok", "artifact": str(MODEL_PATH)}
