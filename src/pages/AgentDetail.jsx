import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, ArrowRight } from 'lucide-react';
import SmsThread from '../components/agents/SmsThread';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import PhaseIndicator from '../components/agents/PhaseIndicator';

const phases = ['initial_call', 'pre_licensing', 'taking_exam', 'licensing', 'contracting', 'onboarding_complete'];

export default function AgentDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const agentId = urlParams.get('id');

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const agents = await base44.entities.Agent.list();
      return agents.find(a => a.id === agentId);
    },
    enabled: !!agentId,
  });

  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (agent) {
      setFormData(agent);
    }
  }, [agent]);

  const updateAgentMutation = useMutation({
    mutationFn: (data) => base44.entities.Agent.update(agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent', agentId]);
      queryClient.invalidateQueries(['agents']);
      toast.success('Agent updated successfully!');
    },
    onError: (error) => {
      toast.error('Failed to update agent: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateAgentMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const moveToNextPhase = () => {
    const currentIndex = phases.indexOf(formData.phase);
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      handleChange('phase', nextPhase);
      updateAgentMutation.mutate({ ...formData, phase: nextPhase });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent details...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Agent not found</p>
          <Button onClick={() => navigate(createPageUrl('ManagerDashboard'))} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const canMoveToNext = formData.phase !== 'onboarding_complete';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('ManagerDashboard'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {agent.first_name} {agent.last_name}
            </h1>
            <p className="text-gray-600">Manage agent details and onboarding progress</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Onboarding Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <PhaseIndicator currentPhase={formData.phase} />
            {canMoveToNext && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={moveToNextPhase}
                  disabled={updateAgentMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Move to {phases[phases.indexOf(formData.phase) + 1]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <SmsThread agentId={agentId} agent={agent} />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Agent Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="agency_name">Agency Name</Label>
                  <Input
                    id="agency_name"
                    value={formData.agency_name || ''}
                    onChange={(e) => handleChange('agency_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phase">Phase</Label>
                  <Select value={formData.phase} onValueChange={(value) => handleChange('phase', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {phases.map(phase => (
                        <SelectItem key={phase} value={phase}>
                          {phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_started">Start Date</Label>
                <Input
                  id="date_started"
                  type="date"
                  value={formData.date_started || ''}
                  onChange={(e) => handleChange('date_started', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('ManagerDashboard'))}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateAgentMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateAgentMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}