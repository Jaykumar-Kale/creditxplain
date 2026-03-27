// Pure JS ML Engine - No Python needed!
// Implements Logistic Regression + Decision Tree logic with SHAP-like explanations

export function calculateCreditScore(data) {
  const {
    age, income, employmentYears, loanAmount, existingDebts,
    creditHistory, numberOfDependents, monthlyExpenses,
    savingsBalance, educationLevel, homeOwnership
  } = data;

  // Feature Engineering
  const debtToIncomeRatio = (existingDebts + (loanAmount / 60)) / (income / 12);
  const savingsRatio = savingsBalance / (income || 1);
  const expenseRatio = monthlyExpenses / (income / 12 || 1);
  const loanToIncomeRatio = loanAmount / (income || 1);
  const netMonthlyIncome = (income / 12) - monthlyExpenses - existingDebts;

  // Education multiplier
  const educationScore = { phd: 1.1, master: 1.07, bachelor: 1.03, other: 1.0, high_school: 0.97 };
  const homeScore = { own: 1.08, mortgage: 1.04, rent: 1.0, other: 0.97 };

  // Weighted scoring (simulates trained logistic regression weights)
  let baseScore = 300;

  // Credit History (35% weight - most important)
  baseScore += (creditHistory / 10) * 245;

  // Payment capacity / DTI (30% weight)
  const dtiScore = Math.max(0, 1 - debtToIncomeRatio) * 210;
  baseScore += dtiScore;

  // Employment stability (15% weight)
  const empScore = Math.min(employmentYears / 10, 1) * 105;
  baseScore += empScore;

  // Savings & Assets (10% weight)
  const savScore = Math.min(savingsRatio, 1) * 70;
  baseScore += savScore;

  // Loan amount vs income (10% weight)
  const ltiScore = Math.max(0, 1 - loanToIncomeRatio * 0.3) * 70;
  baseScore += ltiScore;

  // Adjustments
  baseScore *= (educationScore[educationLevel] || 1.0);
  baseScore *= (homeScore[homeOwnership] || 1.0);
  if (age < 21) baseScore *= 0.92;
  if (age > 60) baseScore *= 0.97;
  if (numberOfDependents > 3) baseScore *= 0.95;
  if (netMonthlyIncome < 0) baseScore *= 0.75;

  const creditScore = Math.round(Math.min(850, Math.max(300, baseScore)));

  // Decision
  let decision, riskLevel, interestRateRange, maxApprovedAmount;
  if (creditScore >= 750) {
    decision = 'approved'; riskLevel = 'low';
    interestRateRange = '6.5% - 8.5%';
    maxApprovedAmount = Math.min(loanAmount, income * 5);
  } else if (creditScore >= 650) {
    decision = 'approved'; riskLevel = 'medium';
    interestRateRange = '9% - 13%';
    maxApprovedAmount = Math.min(loanAmount, income * 3);
  } else if (creditScore >= 580) {
    decision = 'review'; riskLevel = 'high';
    interestRateRange = '14% - 18%';
    maxApprovedAmount = Math.min(loanAmount * 0.6, income * 2);
  } else {
    decision = 'rejected'; riskLevel = 'very_high';
    interestRateRange = 'N/A';
    maxApprovedAmount = 0;
  }

  // SHAP-like Feature Importance Explanations
  const factors = [
    {
      factor: 'Credit History',
      impact: `Your credit history score of ${creditHistory}/10 is ${creditHistory >= 7 ? 'strong' : creditHistory >= 5 ? 'moderate' : 'weak'}`,
      direction: creditHistory >= 7 ? 'positive' : 'negative',
      weight: Math.round((creditHistory / 10) * 35),
      rawValue: creditHistory
    },
    {
      factor: 'Debt-to-Income Ratio',
      impact: `Your DTI ratio is ${(debtToIncomeRatio * 100).toFixed(1)}% — ${debtToIncomeRatio < 0.35 ? 'well within safe limits' : debtToIncomeRatio < 0.5 ? 'slightly elevated' : 'dangerously high'}`,
      direction: debtToIncomeRatio < 0.35 ? 'positive' : 'negative',
      weight: Math.round(Math.max(0, 1 - debtToIncomeRatio) * 30),
      rawValue: debtToIncomeRatio
    },
    {
      factor: 'Employment Stability',
      impact: `${employmentYears} year(s) of employment shows ${employmentYears >= 5 ? 'excellent' : employmentYears >= 2 ? 'adequate' : 'limited'} job stability`,
      direction: employmentYears >= 2 ? 'positive' : 'negative',
      weight: Math.round(Math.min(employmentYears / 10, 1) * 15),
      rawValue: employmentYears
    },
    {
      factor: 'Savings & Liquidity',
      impact: `Savings of ₹${savingsBalance.toLocaleString()} represents ${(savingsRatio * 100).toFixed(0)}% of annual income`,
      direction: savingsRatio >= 0.1 ? 'positive' : 'negative',
      weight: Math.round(Math.min(savingsRatio, 1) * 10),
      rawValue: savingsBalance
    },
    {
      factor: 'Loan-to-Income Ratio',
      impact: `Requested loan is ${(loanToIncomeRatio * 100).toFixed(0)}% of annual income — ${loanToIncomeRatio < 2 ? 'reasonable' : loanToIncomeRatio < 4 ? 'moderate' : 'very high'}`,
      direction: loanToIncomeRatio < 2 ? 'positive' : 'negative',
      weight: Math.round(Math.max(0, 1 - loanToIncomeRatio * 0.3) * 10),
      rawValue: loanToIncomeRatio
    },
    {
      factor: 'Net Monthly Cash Flow',
      impact: `After expenses, you have ₹${netMonthlyIncome.toFixed(0)}/month — ${netMonthlyIncome > 5000 ? 'healthy buffer' : netMonthlyIncome > 0 ? 'tight but positive' : 'negative cash flow — critical issue'}`,
      direction: netMonthlyIncome > 0 ? 'positive' : 'negative',
      weight: netMonthlyIncome > 5000 ? 8 : netMonthlyIncome > 0 ? 4 : 0,
      rawValue: netMonthlyIncome
    }
  ];

  // Recommendation
  const weakFactors = factors.filter(f => f.direction === 'negative').map(f => f.factor);
  let recommendation = '';
  if (decision === 'approved') {
    recommendation = `Congratulations! To maintain this score, keep your credit history strong and avoid taking on additional debt.`;
  } else if (decision === 'review') {
    recommendation = `Your application requires manual review. Improving ${weakFactors.slice(0, 2).join(' and ')} could push you to automatic approval.`;
  } else {
    recommendation = `To improve your chances: Focus on ${weakFactors.slice(0, 2).join(' and ')}. Consider reducing existing debts first, then reapply.`;
  }

  // What-if scenarios
  const whatIfScenarios = generateWhatIfScenarios(data, creditScore);

  return {
    creditScore,
    decision,
    riskLevel,
    probability: creditScore / 850,
    explanations: factors,
    recommendation,
    interestRateRange,
    maxApprovedAmount: Math.round(maxApprovedAmount),
    whatIfScenarios
  };
}

function generateWhatIfScenarios(data, currentScore) {
  const scenarios = [];

  // Scenario 1: Improve credit history
  const improvedCredit = { ...data, creditHistory: Math.min(10, data.creditHistory + 2) };
  const score1 = calculateCreditScore(improvedCredit).creditScore;
  scenarios.push({
    scenario: 'If you improved credit history by 2 points',
    newScore: score1,
    change: score1 - currentScore
  });

  // Scenario 2: Reduce debt by 30%
  const reducedDebt = { ...data, existingDebts: data.existingDebts * 0.7 };
  const score2 = calculateCreditScore(reducedDebt).creditScore;
  scenarios.push({
    scenario: 'If you reduced existing debts by 30%',
    newScore: score2,
    change: score2 - currentScore
  });

  // Scenario 3: Increase savings by 50%
  const moreSavings = { ...data, savingsBalance: data.savingsBalance * 1.5 };
  const score3 = calculateCreditScore(moreSavings).creditScore;
  scenarios.push({
    scenario: 'If you increased savings by 50%',
    newScore: score3,
    change: score3 - currentScore
  });

  // Scenario 4: Request smaller loan
  const smallerLoan = { ...data, loanAmount: data.loanAmount * 0.7 };
  const score4 = calculateCreditScore(smallerLoan).creditScore;
  scenarios.push({
    scenario: 'If you requested 30% less loan amount',
    newScore: score4,
    change: score4 - currentScore
  });

  return scenarios;
}

export function computeBiasMetrics(applications) {
  const genderGroups = {};
  applications.forEach(app => {
    const gender = app.applicantData.gender || 'unknown';
    if (!genderGroups[gender]) genderGroups[gender] = { total: 0, approved: 0, avgScore: 0, scores: [] };
    genderGroups[gender].total++;
    if (app.result.decision === 'approved') genderGroups[gender].approved++;
    genderGroups[gender].scores.push(app.result.creditScore);
  });

  Object.keys(genderGroups).forEach(g => {
    const grp = genderGroups[g];
    grp.approvalRate = grp.total ? (grp.approved / grp.total * 100).toFixed(1) : 0;
    grp.avgScore = grp.scores.length ? Math.round(grp.scores.reduce((a, b) => a + b, 0) / grp.scores.length) : 0;
  });

  return { genderGroups };
}