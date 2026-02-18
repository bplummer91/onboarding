import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, Calendar, TrendingUp, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const phaseColors = {
  initial_call: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  pre_licensing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  taking_exam: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  licensing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  contracting: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  onboarding_complete: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const phaseLabels = {
  initial_call: 'Initial Call',
  pre_licensing: 'Pre-Licensing',
  taking_exam: 'Taking Exam',
  licensing: 'Licensing',
  contracting: 'Contracting',
  onboarding_complete: 'Complete',
};

function ProgressBar({ percent }) {
  const color =
    percent === 100 ? 'bg-green-500' :
    percent >= 66 ? 'bg-blue-500' :
    percent >= 33 ? 'bg-yellow-500' : 'bg-red-400';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">Action Items</span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{percent}%</span>
      </div>
      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function AgentCard({ agent, progressPercent = 0, onClick }) {
  const lastActivity = agent.updated_date
    ? formatDistanceToNow(new Date(agent.updated_date), { addSuffix: true })
    : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-600"
      onClick={() => onClick(agent)}
    >
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-200">
                {agent.first_name?.[0]}{agent.last_name?.[0]}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {agent.first_name} {agent.last_name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{agent.email}</p>
            </div>
          </div>
          <Badge className={`${phaseColors[agent.phase]} flex-shrink-0 text-xs`}>
            {phaseLabels[agent.phase] || agent.phase}
          </Badge>
        </div>

        {/* Progress bar */}
        <ProgressBar percent={progressPercent} />

        {/* Details */}
        <div className="space-y-1.5">
          {agent.agency_name && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{agent.agency_name}</span>
            </div>
          )}
          {agent.direct_upline && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Upline: {agent.direct_upline}</span>
            </div>
          )}
          {agent.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{agent.phone}</span>
            </div>
          )}
          {agent.date_started && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Started {format(new Date(agent.date_started), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>

        {/* Last activity */}
        {lastActivity && (
          <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-400 dark:text-gray-500">Active {lastActivity}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}