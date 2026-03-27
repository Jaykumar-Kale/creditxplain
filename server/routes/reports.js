import express from 'express';
import { protect } from '../middleware/auth.js';
import Application from '../models/Application.js';
import PDFDocument from 'pdfkit';

const router = express.Router();

router.get('/pdf/:id', protect, async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, userId: req.user._id });
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=credit-report-${app._id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(24).fillColor('#1e40af').text('CreditXplain', { align: 'center' });
    doc.fontSize(14).fillColor('#6b7280').text('Explainable Credit Score Report', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e5e7eb').stroke();
    doc.moveDown();

    // Score
    const scoreColor = app.result.creditScore >= 750 ? '#16a34a' : app.result.creditScore >= 650 ? '#d97706' : '#dc2626';
    doc.fontSize(48).fillColor(scoreColor).text(app.result.creditScore.toString(), { align: 'center' });
    doc.fontSize(14).fillColor('#374151').text(`Decision: ${app.result.decision.toUpperCase()}`, { align: 'center' });
    doc.moveDown();

    // Applicant Data
    doc.fontSize(16).fillColor('#1e40af').text('Application Details');
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Income: ₹${app.applicantData.income?.toLocaleString()}`);
    doc.text(`Loan Amount: ₹${app.applicantData.loanAmount?.toLocaleString()}`);
    doc.text(`Employment: ${app.applicantData.employmentYears} years`);
    doc.text(`Credit History: ${app.applicantData.creditHistory}/10`);
    doc.text(`Risk Level: ${app.result.riskLevel?.toUpperCase()}`);
    doc.text(`Interest Rate Range: ${app.result.interestRateRange}`);
    doc.moveDown();

    // Explanations
    doc.fontSize(16).fillColor('#1e40af').text('Why This Decision?');
    doc.moveDown(0.5);
    app.result.explanations.forEach(exp => {
      const color = exp.direction === 'positive' ? '#16a34a' : '#dc2626';
      doc.fontSize(11).fillColor(color).text(`${exp.direction === 'positive' ? '✓' : '✗'} ${exp.factor}`);
      doc.fontSize(10).fillColor('#6b7280').text(`   ${exp.impact}`);
      doc.moveDown(0.3);
    });

    doc.moveDown();
    doc.fontSize(12).fillColor('#1e40af').text('Recommendation:');
    doc.fontSize(11).fillColor('#374151').text(app.result.recommendation);

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#9ca3af').text(
      `Generated on ${new Date().toLocaleDateString()} | Application ID: ${app._id} | CreditXplain™`,
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;