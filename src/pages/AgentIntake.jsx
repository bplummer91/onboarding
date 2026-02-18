import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, UserPlus, ShieldCheck, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function AgentIntake() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [agentType, setAgentType] = useState(null); // 'unlicensed' | 'licensed'
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    agency_name: '',
    notes: '',
    date_started: new Date().toISOString().split('T')[0],
    phase: 'initial_call'
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const createAgentMutation = useMutation({
    mutationFn: async (data) => {
      const agent = await base44.entities.Agent.create(data);
      await base44.entities.AgentManager.create({
        agent_id: agent.id,
        manager_email: user.email
      });
      return agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['agents']);
      queryClient.invalidateQueries(['agentManagers']);
      toast.success('Agent created successfully!');
      navigate(createPageUrl('ManagerDashboard'));
    },
    onError: (error) => {
      toast.error('Failed to create agent: ' + error.message);
    }
  });

  const handleAgentTypeSelect = (type) => {
    setAgentType(type);
    setFormData(prev => ({
      ...prev,
      phase: type === 'licensed' ? 'contracting' : 'initial_call'
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createAgentMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('ManagerDashboard'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {!agentType && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Add New Agent</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Select the agent type to get started</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <button
                  type="button"
                  onClick={() => handleAgentTypeSelect('unlicensed')}
                  className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all text-left"
                >
                  <div className="p-4 bg-orange-100 rounded-full">
                    <BookOpen className="w-8 h-8 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unlicensed Agent</h3>
                    <p className="text-sm text-gray-500 mt-1">Starts from the beginning of the onboarding pipeline (Initial Call)</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleAgentTypeSelect('licensed')}
                  className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all text-left"
                >
                  <div className="p-4 bg-green-100 rounded-full">
                    <ShieldCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Licensed Agent</h3>
                    <p className="text-sm text-gray-500 mt-1">Already licensed — starts at the Contracting phase</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
        {agentType && (
        <Card>

          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${agentType === 'licensed' ? 'bg-green-100' : 'bg-orange-100'}`}>
                {agentType === 'licensed' ? <ShieldCheck className="w-6 h-6 text-green-600" /> : <BookOpen className="w-6 h-6 text-orange-600" />}
              </div>
              <div>
                <CardTitle className="text-2xl">{agentType === 'licensed' ? 'Licensed' : 'Unlicensed'} Agent Intake</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {agentType === 'licensed' ? 'Will start at the Contracting phase' : 'Will start at the Initial Call phase'}
                  {' · '}
                  <button type="button" onClick={() => setAgentType(null)} className="text-blue-600 hover:underline">Change</button>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="agency_name">Agency Name</Label>
                  <Input
                    id="agency_name"
                    value={formData.agency_name}
                    onChange={(e) => handleChange('agency_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_started">Start Date</Label>
                  <Input
                    id="date_started"
                    type="date"
                    value={formData.date_started}
                    onChange={(e) => handleChange('date_started', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Additional information about this agent..."
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
                  disabled={createAgentMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {createAgentMutation.isPending ? 'Creating...' : 'Create Agent'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}