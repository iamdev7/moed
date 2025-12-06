import React from 'react';
import { AppStep } from '../types';
import { Settings, FileText, CheckCircle } from 'lucide-react';

interface Props {
  currentStep: AppStep;
}

const steps = [
  { id: 'setup', label: 'الإعدادات', icon: Settings },
  { id: 'content', label: 'المحتوى', icon: FileText },
  { id: 'preview', label: 'التصدير', icon: CheckCircle },
];

const StepIndicator: React.FC<Props> = ({ currentStep }) => {
  if (currentStep === 'generating' || currentStep === 'taking') return null;

  return (
    <div className="flex justify-center mb-10 no-print">
      <div className="flex items-center w-full max-w-2xl px-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const stepIndex = steps.findIndex(s => s.id === step.id);
          const currentIndex = steps.findIndex(s => s.id === currentStep);
          const isCompleted = currentIndex > stepIndex;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center relative z-10 group">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-teal-200 ring-4 ring-teal-50 scale-110'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white border border-slate-200 text-slate-300'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`mt-3 text-xs font-bold transition-colors ${
                    isActive ? 'text-teal-700' : isCompleted ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-grow mx-2 h-1 mb-6 rounded-full overflow-hidden bg-slate-100">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      isCompleted ? 'bg-emerald-500 w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;