import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

const steps = [
  {
    title: 'Personal Info',
    fields: [
      { name: 'age', label: 'Age', type: 'number', placeholder: '28', min: 18, max: 80 },
      { name: 'educationLevel', label: 'Education Level', type: 'select',
        options: [['high_school','High School'],['bachelor','Bachelor\'s'],['master','Master\'s'],['phd','PhD'],['other','Other']] },
      { name: 'maritalStatus', label: 'Marital Status', type: 'select',
        options: [['single','Single'],['married','Married'],['divorced','Divorced'],['widowed','Widowed']] },
      { name: 'numberOfDependents', label: 'Number of Dependents', type: 'number', placeholder: '0', min: 0 },
      { name: 'gender', label: 'Gender (optional, for bias analysis)', type: 'select',
        options: [['prefer_not_to_say','Prefer not to say'],['male','Male'],['female','Female'],['other','Other']] }
    ]
  },
  {
    title: 'Financial Details',
    fields: [
      { name: 'income', label: 'Annual Income (₹)', type: 'number', placeholder: '600000', min: 0 },
      { name: 'monthlyExpenses', label: 'Monthly Expenses (₹)', type: 'number', placeholder: '25000', min: 0 },
      { name: 'existingDebts', label: 'Existing Monthly Debt Payments (₹)', type: 'number', placeholder: '5000', min: 0 },
      { name: 'savingsBalance', label: 'Total Savings Balance (₹)', type: 'number', placeholder: '100000', min: 0 },
      { name: 'homeOwnership', label: 'Home Ownership', type: 'select',
        options: [['rent','Renting'],['own','Own Home'],['mortgage','Mortgage'],['other','Other']] }
    ]
  },
  {
    title: 'Employment & Credit',
    fields: [
      { name: 'employmentYears', label: 'Years of Employment', type: 'number', placeholder: '3', min: 0 },
      { name: 'creditHistory', label: 'Credit History Score (0-10)', type: 'number', placeholder: '7', min: 0, max: 10 }
    ]
  },
  {
    title: 'Loan Details',
    fields: [
      { name: 'loanAmount', label: 'Loan Amount Requested (₹)', type: 'number', placeholder: '500000', min: 1000 },
      { name: 'loanPurpose', label: 'Loan Purpose', type: 'select',
        options: [['home','Home Purchase'],['car','Car Loan'],['education','Education'],['business','Business'],['medical','Medical'],['personal','Personal'],['other','Other']] }
    ]
  }
];

export default function CreditForm({ onResult }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, trigger, getValues } = useForm({
    defaultValues: {
      gender: 'prefer_not_to_say', educationLevel: 'bachelor',
      maritalStatus: 'single', homeOwnership: 'rent',
      loanPurpose: 'personal', numberOfDependents: 0,
      existingDebts: 0, savingsBalance: 0
    }
  });

  const currentFields = steps[step].fields;

  const nextStep = async () => {
    const fieldNames = currentFields.map(f => f.name);
    const valid = await trigger(fieldNames);
    if (valid) setStep(s => Math.min(s + 1, steps.length - 1));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const numericFields = ['age','income','employmentYears','loanAmount','existingDebts',
        'creditHistory','numberOfDependents','monthlyExpenses','savingsBalance'];
      numericFields.forEach(f => { if (data[f] !== undefined) data[f] = Number(data[f]); });

      const res = await api.post('/credit/apply', data);
      onResult(res.data.result);
      toast.success('Credit score calculated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to calculate score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {steps.map((s, i) => (
            <span key={i} className={`text-xs font-medium ${i <= step ? 'text-brand-600' : 'text-gray-400'}`}>
              {s.title}
            </span>
          ))}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-brand-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Step {step + 1}: {steps[step].title}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentFields.map(field => (
              <div key={field.name} className={field.type === 'select' ? '' : ''}>
                <label className="label">{field.label}</label>
                {field.type === 'select' ? (
                  <select className="input-field" {...register(field.name, { required: `${field.label} is required` })}>
                    {field.options.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                ) : (
                  <input type={field.type} placeholder={field.placeholder}
                    className="input-field"
                    {...register(field.name, {
                      required: `${field.label} is required`,
                      min: field.min !== undefined ? { value: field.min, message: `Min value is ${field.min}` } : undefined,
                      max: field.max !== undefined ? { value: field.max, message: `Max value is ${field.max}` } : undefined
                    })} />
                )}
                {errors[field.name] && (
                  <p className="text-red-500 text-xs mt-1">{errors[field.name].message}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < steps.length - 1 ? (
              <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2 ml-auto">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 ml-auto">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Calculating...</>
                ) : (
                  <><Send className="w-4 h-4" /> Calculate Score</>
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}