import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const phases = [
  { id: 'initial_call', label: 'Initial Call' },
  { id: 'pre_licensing', label: 'Pre-Licensing' },
  { id: 'taking_exam', label: 'Taking Exam' },
  { id: 'licensing', label: 'Licensing' },
  { id: 'contracting', label: 'Contracting' },
  { id: 'onboarding_complete', label: 'Onboarding Complete' }
];

export default function PhaseIndicator({ currentPhase, size = 'default' }) {
  const currentIndex = phases.findIndex(p => p.id === currentPhase);
  
  return (
    <div className={cn("flex items-center gap-2", size === 'small' && "gap-1")}>
      {phases.map((phase, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        
        return (
          <React.Fragment key={phase.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "rounded-full flex items-center justify-center transition-all",
                  size === 'small' ? "w-6 h-6" : "w-10 h-10",
                  isComplete && "bg-green-500 text-white",
                  isCurrent && "bg-blue-500 text-white ring-4 ring-blue-100",
                  isPending && "bg-gray-200 text-gray-400"
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className={size === 'small' ? "w-3 h-3" : "w-5 h-5"} />
                ) : isCurrent ? (
                  <Clock className={size === 'small' ? "w-3 h-3" : "w-5 h-5"} />
                ) : (
                  <Circle className={size === 'small' ? "w-3 h-3" : "w-5 h-5"} />
                )}
              </div>
              {size !== 'small' && (
                <span
                  className={cn(
                    "text-xs font-medium text-center",
                    isCurrent ? "text-blue-600" : "text-gray-500"
                  )}
                >
                  {phase.label}
                </span>
              )}
            </div>
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 min-w-8 transition-all",
                  isComplete ? "bg-green-500" : "bg-gray-200",
                  size === 'small' && "min-w-4"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}