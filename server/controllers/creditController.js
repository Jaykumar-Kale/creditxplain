import Application from '../models/Application.js';
import { scoreApplication, computeBiasMetrics } from '../utils/mlEngine.js';

export const submitApplication = async (req, res) => {
  try {
    const applicantData = req.body;

    // Validate required fields
    const required = ['age', 'income', 'employmentYears', 'loanAmount', 'creditHistory', 'monthlyExpenses', 'loanPurpose'];
    for (const field of required) {
      if (applicantData[field] === undefined || applicantData[field] === null || applicantData[field] === '') {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    // Run ML Engine
    const result = await scoreApplication(applicantData);

    // Save to DB
    const application = new Application({
      userId: req.user._id,
      applicantData,
      result: {
        creditScore: result.creditScore,
        decision: result.decision,
        riskLevel: result.riskLevel,
        probability: result.probability,
        explanations: result.explanations,
        recommendation: result.recommendation,
        interestRateRange: result.interestRateRange,
        maxApprovedAmount: result.maxApprovedAmount
      },
      whatIfScenarios: result.whatIfScenarios
    });

    await application.save();

    res.status(201).json({
      success: true,
      applicationId: application._id,
      result: {
        ...result,
        applicationId: application._id
      }
    });
  } catch (err) {
    console.error('Credit scoring error:', err);
    res.status(500).json({ error: 'Failed to process application', details: err.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const applications = await Application.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-applicantData.gender');

    const total = await Application.countDocuments({ userId: req.user._id });

    res.json({
      applications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json(application);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch application' });
  }
};

export const getBiasReport = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id });
    if (applications.length < 2) {
      return res.json({ message: 'Need more applications for bias analysis', metrics: null });
    }
    const metrics = computeBiasMetrics(applications);
    res.json({ metrics, totalApplications: applications.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute bias metrics' });
  }
};

export const getStats = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id });
    const stats = {
      total: applications.length,
      approved: applications.filter(a => a.result.decision === 'approved').length,
      rejected: applications.filter(a => a.result.decision === 'rejected').length,
      review: applications.filter(a => a.result.decision === 'review').length,
      avgScore: applications.length
        ? Math.round(applications.reduce((sum, a) => sum + a.result.creditScore, 0) / applications.length)
        : 0,
      scoreHistory: applications.slice(-10).map(a => ({
        date: a.createdAt,
        score: a.result.creditScore,
        decision: a.result.decision
      }))
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};  