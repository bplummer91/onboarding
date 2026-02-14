import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import PhaseIndicator from './PhaseIndicator';

const phaseColors = {
  initial_call: 'bg-blue-100 text-blue-800',
  enrolled_in_xcel: 'bg-indigo-100 text-indigo-800',
  taking_exam: 'bg-purple-100 text-purple-800',
  licensing: 'bg-yellow-100 text-yellow-800',
  contracting: 'bg-orange-100 text-orange-800',
  onboarding_complete: 'bg-green-100 text-green-800'
};

export default function AgentCard({ agent, onClick }) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick(agent)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              {agent.first_name} {agent.last_name}
            </h3>
            <Badge className={phaseColors[agent.phase] || 'bg-gray-100 text-gray-800'}>
              {agent.phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{agent.email}</span>
        </div>
        {agent.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="w-4 h-4" />
            <span>{agent.phone}</span>
          </div>
        )}
        {agent.agency_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>{agent.agency_name}</span>
          </div>
        )}
        {agent.date_started && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Started {format(new Date(agent.date_started), 'MMM d, yyyy')}</span>
          </div>
        )}
        <div className="pt-2">
          <PhaseIndicator currentPhase={agent.phase} size="small" />
        </div>
      </CardContent>
    </Card>
  );
}