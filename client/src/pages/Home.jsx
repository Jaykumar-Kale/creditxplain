import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, Zap, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: Eye, title: 'Transparent Decisions', desc: 'Every score comes with a plain-English explanation of exactly why you got that score.' },
  { icon: Shield, title: 'Bias Detection', desc: 'Real-time fairness monitoring ensures no demographic group is unfairly disadvantaged.' },
  { icon: Zap, title: 'Instant Results', desc: 'Get your credit score and full explanation in under 2 seconds — no waiting.' },
  { icon: BarChart3, title: 'What-If Simulator', desc: 'Explore how improving specific factors would change your score.' }
];

const stats = [
  { value: '850', label: 'Max Credit Score' },
  { value: '6', label: 'Explanation Factors' },
  { value: '4', label: 'What-If Scenarios' },
  { value: '100%', label: 'Transparent' }
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16">
        <span className="inline-block bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-sm font-semibold px-4 py-2 rounded-full mb-4">
          🏆 Built for Research Hackathons
        </span>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-gray-50 mb-6 leading-tight">
          Credit Scoring That<br />
          <span className="text-brand-600 dark:text-brand-400">Explains Itself</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          AI models that approve or reject loans but never explain why. We fix that.
          Get your credit score with a complete, human-readable explanation in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/dashboard" className="btn-primary flex items-center justify-center gap-2 text-lg py-4 px-8">
            Check Your Score <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/about" className="btn-secondary text-lg py-4 px-8">Learn How It Works</Link>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
        {stats.map((stat, i) => (
          <div key={i} className="card text-center">
            <div className="text-3xl font-black text-brand-600 dark:text-brand-400">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Features */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-10">
          What Makes Us Different
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }} className="card hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 rounded-xl flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="card bg-brand-600 dark:bg-brand-700 text-center text-white">
        <h2 className="text-2xl font-bold mb-2">Ready to check your credit score?</h2>
        <p className="text-brand-200 mb-6">Takes less than 2 minutes. Full explanation included.</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors">
          Get Started <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </div>
  );
}