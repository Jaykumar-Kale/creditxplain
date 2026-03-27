# ML Service (Python)

This service provides model-based credit scoring for CreditXplain.

## Model Design

- Primary risk model: GradientBoostingClassifier
- Explanation model: LogisticRegression (local feature contribution style)
- Output format is compatible with the Node.js API response contract.

## Quick Start

1. Create a virtual environment and install dependencies.
2. Train model artifacts.
3. Run FastAPI server.

### Commands

```bash
cd ml
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python train.py
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Endpoints

- GET /health
- POST /score
- POST /train

## Train On Real Dataset

Use a real CSV and compare multiple models (logistic regression, random forest, gradient boosting):

```bash
cd ml
python train_real.py --data path/to/dataset.csv --target defaultRisk
```

If your dataset column names differ from the app schema:

```bash
python train_real.py --data path/to/dataset.csv --target defaultRisk --column-map column_map.json
```

See `DATA_REQUIREMENTS.md` and `column_map.example.json`.

Note: high scores on tiny sample files are not meaningful. Evaluate on large, out-of-time validation data before deployment.

## Notes

- If this service is unavailable, backend falls back to the JS scoring engine.
- Model is trained on synthetic data and should be retrained with real, policy-compliant data for production lending.
