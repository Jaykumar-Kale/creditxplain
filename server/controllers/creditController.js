import Application from '../models/Application.js';
import { scoreApplication, computeBiasMetrics } from '../utils/mlEngine.js';
import { normalizeApplicantFromRow, validateApplicantPayload } from '../utils/applicantNormalizer.js';

async function createScoredApplication(userId, applicantData) {
  const result = await scoreApplication(applicantData);

  const application = new Application({
    userId,
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

  return {
    applicationId: application._id,
    result: {
      ...result,
      applicationId: application._id
    }
  };
}

export const submitApplication = async (req, res) => {
  try {
    const applicantData = req.body;
    const validation = validateApplicantPayload(applicantData);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const scored = await createScoredApplication(req.user._id, applicantData);

    res.status(201).json({
      success: true,
      applicationId: scored.applicationId,
      result: scored.result
    });
  } catch (err) {
    console.error('Credit scoring error:', err);
    res.status(500).json({ error: 'Failed to process application', details: err.message });
  }
};

export const submitApplicationsFromRows = async (req, res) => {
  try {
    const rows = req.parsedRows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No rows found in uploaded file' });
    }

    const maxRows = Math.min(rows.length, 200);
    const accepted = [];
    const skipped = [];

    for (let i = 0; i < maxRows; i += 1) {
      const raw = rows[i];
      const applicantData = normalizeApplicantFromRow(raw);
      const validation = validateApplicantPayload(applicantData);

      if (!validation.ok) {
        skipped.push({ rowIndex: i + 1, reason: validation.error });
        continue;
      }

      try {
        const scored = await createScoredApplication(req.user._id, applicantData);
        accepted.push({ rowIndex: i + 1, applicantData, ...scored });
      } catch (err) {
        skipped.push({ rowIndex: i + 1, reason: err.message });
      }
    }

    if (!accepted.length) {
      return res.status(400).json({
        error: 'No valid application rows found',
        processedRows: maxRows,
        skipped
      });
    }

    const resultPreview = accepted.slice(0, 25).map(item => ({
      rowIndex: item.rowIndex,
      applicationId: item.applicationId,
      result: item.result
    }));

    res.status(201).json({
      success: true,
      processedRows: maxRows,
      successfulPredictions: accepted.length,
      skipped,
      firstResult: accepted[0].result,
      resultPreview,
      previewCount: resultPreview.length
    });
  } catch (err) {
    console.error('File scoring error:', err);
    res.status(500).json({ error: 'Failed to process uploaded dataset', details: err.message });
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