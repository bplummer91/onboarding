import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users } from 'lucide-react';
import AgentCard from '../components/agents/AgentCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activePhase, setActivePhase] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: agentManagers = [] } = useQuery({
    queryKey: ['agentManagers', user?.email],
    queryFn: () => base44.entities.AgentManager.filter({ manager_email: user?.email }),
    enabled: !!user,
  });

  const agentIds = agentManagers.map(am => am.agent_id);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents', agentIds],
    queryFn: async () => {
      if (agentIds.length === 0) return [];
      const allAgents = await base44.entities.Agent.list();
      return allAgents.filter(agent => agentIds.includes(agent.id));
    },
    enabled: agentIds.length > 0,
  });

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = 
      agent.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.agency_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPhase = activePhase === 'all' || agent.phase === activePhase;
    
    return matchesSearch && matchesPhase;
  });

  const phaseCounts = {
    all: agents.length,
    initial_call: agents.filter(a => a.phase === 'initial_call').length,
    pre_licensing: agents.filter(a => a.phase === 'pre_licensing').length,
    taking_exam: agents.filter(a => a.phase === 'taking_exam').length,
    licensing: agents.filter(a => a.phase === 'licensing').length,
    contracting: agents.filter(a => a.phase === 'contracting').length,
    onboarding_complete: agents.filter(a => a.phase === 'onboarding_complete').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 pt-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Pipeline</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your agents through the onboarding process</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('AgentIntake'))}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Agent
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="all">
                All ({phaseCounts.all})
              </TabsTrigger>
              <TabsTrigger value="initial_call">
                Initial Call ({phaseCounts.initial_call})
              </TabsTrigger>
              <TabsTrigger value="pre_licensing">
                Pre-Licensing ({phaseCounts.pre_licensing})
              </TabsTrigger>
              <TabsTrigger value="taking_exam">
                Exam ({phaseCounts.taking_exam})
              </TabsTrigger>
              <TabsTrigger value="licensing">
                Licensing ({phaseCounts.licensing})
              </TabsTrigger>
              <TabsTrigger value="contracting">
                Contracting ({phaseCounts.contracting})
              </TabsTrigger>
              <TabsTrigger value="onboarding_complete">
                Complete ({phaseCounts.onboarding_complete})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No agents found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first agent'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => navigate(createPageUrl('AgentIntake'))}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Agent
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onClick={(agent) => navigate(createPageUrl('AgentDetail') + '?id=' + agent.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}