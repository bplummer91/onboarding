import React from 'react';

const PHASES = [
  { id: 'initial_call', label: 'Initial Call', color: 'bg-blue-500' },
  { id: 'pre_licensing', label: 'Pre-Licensing', color: 'bg-indigo-500' },
  { id: 'taking_exam', label: 'Taking Exam', color: 'bg-purple-500' },
  { id: 'licensing', label: 'Licensing', color: 'bg-yellow-500' },
  { id: 'contracting', label: 'Contracting', color: 'bg-orange-500' },
  { id: 'onboarding_complete', label: 'Complete', color: 'bg-green-500' },
];

export default function PhaseSummaryBar({ agents }) {
  const counts = {};
  PHASES.forEach(p => { counts[p.id] = agents.filter(a => a.phase === p.id).length; });
  const total = agents.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-6">
      <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
        Pipeline Overview — {total} Agent{total !== 1 ? 's' : ''}
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {PHASES.map(phase => (
          <div key={phase.id} className="text-center">
            <div className={`w-10 h-10 rounded-full ${phase.color} flex items-center justify-center mx-auto mb-1`}>
              <span className="text-white font-bold text-sm">{counts[phase.id]}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{phase.label}</p>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div className="mt-4 flex h-2 rounded-full overflow-hidden gap-0.5">
          {PHASES.map(phase => {
            const pct = total > 0 ? (counts[phase.id] / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={phase.id}
                className={`${phase.color} h-full transition-all`}
                style={{ width: `${pct}%` }}
                title={`${phase.label}: ${counts[phase.id]}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}