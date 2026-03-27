import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shield, AlertTriangle } from 'lucide-react';
import api from '../utils/api.js';
import { motion } from 'framer-motion';

export default function BiasDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/credit/bias-report')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card animate-pulse h-40" />;

  if (!data?.metrics) return (
    <div className="card text-center text-gray-500">
      <Shield className="w-10 h-10 mx-auto mb-2 text-gray-300" />
      <p>Submit more applications to see bias analysis</p>
    </div>
  );

  const genderData = Object.entries(data.metrics.genderGroups || {}).map(([gender, stats]) => ({
    name: gender === 'prefer_not_to_say'
      ? 'Not Disclosed'
      : gender.charAt(0).toUpperCase() + gender.slice(1),
    approvalRate: parseFloat(stats.approvalRate),
    avgScore: stats.avgScore,
    total: stats.total
  }));

  const maxRate = Math.max(...genderData.map(d => d.approvalRate));
  const minRate = Math.min(...genderData.map(d => d.approvalRate));
  const biasDiff = maxRate - minRate;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-brand-600" />
        <h3 className="font-bold text-gray-800 dark:text-gray-100">
          Fairness & Bias Analysis
        </h3>
      </div>

      {biasDiff > 15 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl mb-4 text-yellow-700 dark:text-yellow-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            Potential bias detected: {biasDiff.toFixed(1)}% approval rate disparity between groups
          </span>
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
          Approval Rate by Gender Group
        </p>

        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={genderData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip formatter={(val) => `${val}%`} />
            <Bar dataKey="approvalRate" radius={[6, 6, 0, 0]}>
              {genderData.map((entry, i) => (
                <Cell key={i} fill={entry.approvalRate === maxRate ? '#3b82f6' : '#93c5fd'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {genderData.map((d, i) => (
          <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-xs text-gray-500">{d.name}</p>
            <p className="font-bold text-gray-800 dark:text-gray-100">
              {d.approvalRate}% approved
            </p>
            <p className="text-xs text-gray-500">
              Avg score: {d.avgScore} | {d.total} applications
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-3">
        ℹ️ Gender data is used only for fairness monitoring, not in scoring decisions.
      </p>
    </motion.div>
  );
}