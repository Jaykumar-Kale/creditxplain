import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicantData: {
    age: { type: Number, required: true },
    income: { type: Number, required: true },
    employmentYears: { type: Number, required: true },
    loanAmount: { type: Number, required: true },
    loanPurpose: { type: String, required: true },
    existingDebts: { type: Number, default: 0 },
    creditHistory: { type: Number, min: 0, max: 10, required: true },
    numberOfDependents: { type: Number, default: 0 },
    educationLevel: { type: String, enum: ['high_school', 'bachelor', 'master', 'phd', 'other'] },
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    homeOwnership: { type: String, enum: ['own', 'rent', 'mortgage', 'other'] },
    monthlyExpenses: { type: Number, required: true },
    savingsBalance: { type: Number, default: 0 },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] }
  },
  result: {
    creditScore: { type: Number, required: true },
    decision: { type: String, enum: ['approved', 'rejected', 'review'], required: true },
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'very_high'] },
    probability: { type: Number },
    explanations: [{ factor: String, impact: String, direction: String, weight: Number }],
    recommendation: { type: String },
    interestRateRange: { type: String },
    maxApprovedAmount: { type: Number }
  },
  fairnessMetrics: {
    biasScore: { type: Number },
    groupComparisons: { type: mongoose.Schema.Types.Mixed }
  },
  whatIfScenarios: [{ scenario: String, newScore: Number, change: Number }],
  status: { type: String, enum: ['pending', 'completed', 'error'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

applicationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Application', applicationSchema);