import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Download } from 'lucide-react';
import api from '../utils/api.js';

function ScoreRing({ score }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const maxScore = 850;
  const minScore = 300;
  const percentage = (score - minScore) / (maxScore - minScore);
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    setTimeout(() => setOffset(circumference * (1 - percentage)), 300);
  }, [score]);

  const color = score >= 750 ? '#16a34a' : score >= 650 ? '#d97706' : score >= 580 ? '#ea580c' : '#dc2626';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle cx="100" cy="100" r={radius} fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round" strokeDasharray={circumference}
            strokeDashoffset={offset} className="score-ring"
            style={{ transition: 'stroke-dashoffset 2s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-4xl font-black" style={{ color }}
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
            {score}
          </motion.span>
          <span className="text-xs text-gray-500">out of 850</span>
        </div>
      </div>
      <div className="flex justify-between w-full px-4 text-xs text-gray-400 mt-1">
        <span>300 Poor</span><span>580 Fair</span><span>650 Good</span><span>750+ Excellent</span>
      </div>
    </div>
  );
}

export default function ScoreResult({ result }) {
  const { creditScore, decision, riskLevel, explanations, recommendation,
          interestRateRange, maxApprovedAmount, whatIfScenarios, applicationId } = result;

  const decisionConfig = {
    approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', label: 'APPROVED' },
    rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', label: 'REJECTED' },
    review: { icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', label: 'UNDER REVIEW' }
  };

  const dc = decisionConfig[decision];
  const Icon = dc.icon;

  const downloadPDF = async () => {
    if (!applicationId) return;
    try {
      const res = await api.get(`/reports/pdf/${applicationId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `credit-report-${applicationId}.pdf`;
      a.click();
    } catch (e) { alert('Failed to download PDF'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Score Card */}
      <div className="card text-center">
        <ScoreRing score={creditScore} />
        <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl border ${dc.bg} ${dc.border}`}>
          <Icon className={`w-5 h-5 ${dc.color}`} />
          <span className={`font-bold ${dc.color}`}>{dc.label}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Risk Level</p>
            <p className="font-semibold capitalize text-gray-800 dark:text-gray-200">{riskLevel?.replace('_', ' ')}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Interest Rate</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">{interestRateRange}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Max Loan</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">₹{maxApprovedAmount?.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Score Range</p>
            <p className="font-semibold text-gray-800 dark:text-gray-200">300 – 850</p>
          </div>
        </div>
        <button onClick={downloadPDF}
          className="mt-4 btn-secondary flex items-center gap-2 mx-auto">
          <Download className="w-4 h-4" /> Download PDF Report
        </button>
      </div>

      {/* Explanations */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Why This Score?</h3>
        <div className="space-y-3">
          {explanations?.map((exp, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className={`p-3 rounded-xl flex items-start gap-3 ${
                exp.direction === 'positive' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${exp.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{exp.factor}</span>
                  <span className={`text-xs font-bold ${exp.direction === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {exp.direction === 'positive' ? '+' : '-'}{exp.weight}pts
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{exp.impact}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-2">
                  <div className={`h-1 rounded-full ${exp.direction === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(exp.weight * 3, 100)}%` }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* What-If Scenarios */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-600" /> What-If Simulator
        </h3>
        <p className="text-sm text-gray-500 mb-4">See how changes could improve your score:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {whatIfScenarios?.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500 mb-2">{s.scenario}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{s.newScore}</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  s.change > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {s.change > 0 ? '+' : ''}{s.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div className="card border-l-4 border-brand-500">
        <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">💡 Recommendation</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation}</p>
      </div>
    </motion.div>
  );
}