import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CreditForm from '../components/CreditForm.jsx';
import ScoreResult from '../components/ScoreResult.jsx';
import BiasDashboard from '../components/BiasDashboard.jsx';
import DecisionFlow from '../components/DecisionFlow.jsx';
import { RefreshCw } from 'lucide-react';
import api from '../utils/api.js';

export default function Dashboard() {
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/credit/stats').then(res => setStats(res.data)).catch(() => {});
  }, [result]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">
          Credit Score Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Fill in your financial details to get an explainable credit score
        </p>
      </div>

      {stats && stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applications', value: stats.total, color: 'text-brand-600' },
            { label: 'Approved', value: stats.approved, color: 'text-green-600' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
            { label: 'Avg Score', value: stats.avgScore, color: 'text-purple-600' }
          ].map((s, i) => (
            <div key={i} className="card text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {!result ? (
            <CreditForm onResult={setResult} />
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  Your Results
                </h2>
                <button onClick={() => setResult(null)} className="btn-secondary flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" /> New Application
                </button>
              </div>
              <ScoreResult result={result} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <BiasDashboard />
          <DecisionFlow />
        </div>
      </div>
    </div>
  );
}