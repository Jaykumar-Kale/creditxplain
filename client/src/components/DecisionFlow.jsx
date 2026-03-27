import React from 'react';
import { motion } from 'framer-motion';

const nodes = [
  { label: 'Application Submitted', color: '#3b82f6' },
  { label: 'Feature Extraction', color: '#8b5cf6' },
  { label: 'ML Model Processing', color: '#6366f1' },
  { label: 'SHAP Explanation Engine', color: '#0ea5e9' },
  { label: 'Bias & Fairness Check', color: '#f59e0b' },
  { label: 'Final Decision', color: '#10b981' }
];

export default function DecisionFlow() {
  return (
    <div className="card">
      <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">How Decisions Are Made</h3>
      <div className="flex flex-col gap-2">
        {nodes.map((node, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: node.color }}>
              {i + 1}
            </div>
            <div className="flex-1 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
              {node.label}
            </div>
            {i < nodes.length - 1 && (
              <div className="absolute" style={{ marginLeft: '15px', marginTop: '36px' }}>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}