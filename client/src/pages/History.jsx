import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../utils/api.js';

const decisionIcon = { approved: CheckCircle, rejected: XCircle, review: AlertCircle };
const decisionColor = { approved: 'text-green-600', rejected: 'text-red-600', review: 'text-yellow-600' };

export default function History() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    setLoading(true);
    api.get(`/credit/history?page=${page}&limit=10`)
      .then(res => { setApps(res.data.applications); setPagination(res.data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50 mb-2">Application History</h1>
      <p className="text-gray-500 mb-8">Track all your past credit score applications</p>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-24" />)}
        </div>
      ) : apps.length === 0 ? (
        <div className="card text-center py-16">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No applications yet. Check your credit score to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {apps.map((app, i) => {
            const Icon = decisionIcon[app.result.decision];
            return (
              <motion.div key={app._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-6 h-6 ${decisionColor[app.result.decision]}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-2xl text-gray-800 dark:text-gray-100">
                          {app.result.creditScore}
                        </span>
                        <span className={`text-sm font-semibold capitalize ${decisionColor[app.result.decision]}`}>
                          {app.result.decision}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(app.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loan: ₹{app.applicantData.loanAmount?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 capitalize">{app.result.riskLevel?.replace('_', ' ')} risk</p>
                  </div>
                </div>

                {app.result.recommendation && (
                  <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    💡 {app.result.recommendation.slice(0, 150)}...
                  </p>
                )}
              </motion.div>
            );
          })}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium ${
                    p === page ? 'bg-brand-600 text-white' : 'btn-secondary'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}