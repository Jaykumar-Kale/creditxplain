import React from 'react';
import { motion } from 'framer-motion';
import DecisionFlow from '../components/DecisionFlow.jsx';

const xaiConcepts = [
  { term: 'SHAP Values', def: 'SHapley Additive exPlanations — a game theory approach to explain individual feature contributions to a prediction.' },
  { term: 'Fairness Metrics', def: 'Statistical measures that detect if a model treats demographic groups unfairly, including approval rate parity and score distribution.' },
  { term: 'Explainable AI (XAI)', def: 'AI systems designed to be interpretable by humans, allowing stakeholders to understand, trust, and manage AI decisions.' },
  { term: 'Bias Detection', def: 'Analyzing model outputs to find if certain groups are disproportionately approved or rejected for loans.' }
];

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 mb-2">About CreditXplain</h1>
        <p className="text-gray-500 mb-8">Research-grade explainable credit scoring system</p>

        <div className="card mb-6">
          <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-3">The Problem</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Traditional AI credit models are black boxes. They approve or deny loans without explaining why,
            leaving applicants confused and unable to improve their creditworthiness. This creates a trust deficit
            and potential for hidden discrimination.
          </p>
        </div>

        <div className="card mb-6">
          <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-3">Our Solution</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            CreditXplain uses interpretable ML models (Logistic Regression principles) combined with
            SHAP-like explanations to produce credit scores that come with full, plain-English justification.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['Transparent scoring', 'Plain-English explanations', 'Bias monitoring', 'What-if simulation',
              'PDF reports', 'Ethical AI principles'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-green-500">✓</span> {item}
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-4">Key XAI Concepts Used</h2>
          <div className="space-y-4">
            {xaiConcepts.map((c, i) => (
              <div key={i} className="border-l-2 border-brand-500 pl-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">{c.term}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{c.def}</p>
              </div>
            ))}
          </div>
        </div>

        <DecisionFlow />
      </motion.div>
    </div>
  );
}