const COLUMN_ALIASES = {
  age: ['age', 'applicant_age', 'customer_age'],
  income: ['income', 'annual_income', 'monthly_income', 'netmonthlyincome', 'salary'],
  employmentYears: ['employmentyears', 'years_employed', 'employment_years', 'job_tenure', 'time_with_curr_empr'],
  loanAmount: ['loanamount', 'loan_amount', 'requested_loan', 'credit_amount'],
  loanPurpose: ['loanpurpose', 'loan_purpose', 'purpose', 'last_prod_enq2', 'first_prod_enq2'],
  existingDebts: ['existingdebts', 'current_debts_monthly', 'debts', 'emi_obligations', 'tot_missed_pmnt'],
  creditHistory: ['credithistory', 'credit_history', 'credit_history_score', 'cibil_score', 'score'],
  numberOfDependents: ['numberofdependents', 'dependents', 'num_dependents'],
  educationLevel: ['educationlevel', 'education', 'education_level'],
  maritalStatus: ['maritalstatus', 'marital_status'],
  homeOwnership: ['homeownership', 'home_ownership', 'ownership'],
  monthlyExpenses: ['monthlyexpenses', 'monthly_expenses', 'expenses'],
  savingsBalance: ['savingsbalance', 'savings', 'savings_balance'],
  gender: ['gender', 'sex']
};

const EDUCATION_MAP = {
  0: 'high_school',
  1: 'high_school',
  2: 'bachelor',
  3: 'master',
  4: 'phd',
  '10th': 'high_school',
  '12th': 'high_school',
  undergraduate: 'bachelor',
  graduate: 'bachelor',
  bachelor: 'bachelor',
  masters: 'master',
  master: 'master',
  phd: 'phd'
};

const MARITAL_MAP = {
  0: 'single',
  1: 'married',
  2: 'divorced',
  3: 'widowed',
  single: 'single',
  married: 'married',
  divorced: 'divorced',
  widowed: 'widowed'
};

const HOME_MAP = {
  0: 'rent',
  1: 'own',
  2: 'mortgage',
  3: 'other',
  rent: 'rent',
  owned: 'own',
  own: 'own',
  mortgage: 'mortgage'
};

const GENDER_MAP = {
  0: 'male',
  1: 'female',
  2: 'other',
  m: 'male',
  male: 'male',
  f: 'female',
  female: 'female',
  other: 'other'
};

const PURPOSE_MAP = {
  home: 'home',
  housing: 'home',
  hl: 'home',
  car: 'car',
  auto: 'car',
  education: 'education',
  business: 'business',
  medical: 'medical',
  personalloan: 'personal',
  consumerloan: 'personal',
  pl: 'personal',
  personal: 'personal'
};

function normalizeKey(key) {
  return String(key || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findValue(row, canonicalName) {
  const aliases = COLUMN_ALIASES[canonicalName] || [canonicalName.toLowerCase()];
  const normalizedRow = Object.entries(row || {}).reduce((acc, [k, v]) => {
    acc[normalizeKey(k)] = v;
    return acc;
  }, {});

  for (const alias of aliases) {
    const value = normalizedRow[normalizeKey(alias)];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
}

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(num) ? num : fallback;
}

function toCategory(value, map, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'number' && map[value] !== undefined) return map[value];

  const key = String(value).trim().toLowerCase();
  return map[key] || fallback;
}

function normalizeLoanPurpose(value) {
  if (value === undefined || value === null || value === '') return 'personal';
  const key = String(value).trim().toLowerCase();
  return PURPOSE_MAP[key] || 'personal';
}

export function normalizeApplicantFromRow(row = {}) {
  const incomeRaw = findValue(row, 'income');
  const monthlyIncome = toNumber(findValue(row, 'monthlyIncome'), 0);
  let income = toNumber(incomeRaw, 0);
  if (!income && monthlyIncome) income = monthlyIncome * 12;

  let employmentYears = toNumber(findValue(row, 'employmentYears'), 0);
  if (employmentYears > 40) employmentYears = employmentYears / 12; // Some files store tenure in months.

  let creditHistory = toNumber(findValue(row, 'creditHistory'), -1);
  if (creditHistory < 0) {
    const missed = toNumber(findValue(row, 'Tot_Missed_Pmnt'), 0);
    const delinq = toNumber(findValue(row, 'max_recent_level_of_deliq'), 0);
    creditHistory = Math.max(0, Math.min(10, 8 - (missed * 0.2) - (delinq * 0.05)));
  }

  let monthlyExpenses = toNumber(findValue(row, 'monthlyExpenses'), 0);
  if (!monthlyExpenses && income > 0) monthlyExpenses = income * 0.45 / 12;

  const loanFlag = toNumber(findValue(row, 'PL_Flag'), 0);
  let loanAmount = toNumber(findValue(row, 'loanAmount'), 0);
  if (!loanAmount && income > 0) {
    loanAmount = loanFlag ? income * 0.5 : income * 0.25;
  }

  let existingDebts = toNumber(findValue(row, 'existingDebts'), 0);
  if (!existingDebts && loanFlag) {
    existingDebts = Math.max(1000, income * 0.03 / 12);
  }

  const normalized = {
    age: toNumber(findValue(row, 'age'), 30),
    income,
    employmentYears,
    loanAmount,
    loanPurpose: normalizeLoanPurpose(findValue(row, 'loanPurpose')),
    existingDebts,
    creditHistory,
    numberOfDependents: toNumber(findValue(row, 'numberOfDependents'), 0),
    educationLevel: toCategory(findValue(row, 'educationLevel'), EDUCATION_MAP, 'other'),
    maritalStatus: toCategory(findValue(row, 'maritalStatus'), MARITAL_MAP, 'single'),
    homeOwnership: toCategory(findValue(row, 'homeOwnership'), HOME_MAP, 'other'),
    monthlyExpenses,
    savingsBalance: toNumber(findValue(row, 'savingsBalance'), Math.max(0, income * 0.08)),
    gender: toCategory(findValue(row, 'gender'), GENDER_MAP, 'prefer_not_to_say')
  };

  // Coarse conversion: if history appears to be CIBIL style 300-900, map to 0-10.
  if (normalized.creditHistory > 10) {
    normalized.creditHistory = Math.max(0, Math.min(10, ((normalized.creditHistory - 300) / 600) * 10));
  }

  return normalized;
}

export function validateApplicantPayload(data) {
  const required = ['age', 'income', 'employmentYears', 'loanAmount', 'creditHistory', 'monthlyExpenses', 'loanPurpose'];
  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      return { ok: false, error: `Missing required field: ${field}` };
    }
  }
  return { ok: true };
}
