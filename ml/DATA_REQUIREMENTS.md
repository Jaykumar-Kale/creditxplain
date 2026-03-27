# Real Dataset Requirements

To train CreditXplain on real data, provide a CSV with these model columns:

- age
- income
- employmentYears
- loanAmount
- existingDebts
- creditHistory
- numberOfDependents
- monthlyExpenses
- savingsBalance
- educationLevel
- maritalStatus
- homeOwnership
- loanPurpose
- defaultRisk (target: 1=default risk, 0=non-default)

If your dataset uses different names, use `column_map.example.json` format and pass `--column-map`.

## Training command

```bash
cd ml
python train_real.py --data path/to/your_real_dataset.csv --target defaultRisk --column-map column_map.json
```

## Recommendation for authentic scoring

- Use at least 100k+ rows
- Include multiple economic cycles if possible
- Ensure class balance handling (defaults are usually minority)
- Validate with holdout data from different time windows
- Recalibrate approval thresholds with business policy and compliance teams
