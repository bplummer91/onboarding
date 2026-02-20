import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Users, Settings, ArrowUpDown, X } from 'lucide-react';
import AgentCard from '../components/agents/AgentCard';
import PhaseSummaryBar from '../components/dashboard/PhaseSummaryBar';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { calcProgressPercent } from '../components/agents/actionItems';

const PHASES = [
  { id: 'initial_call', label: 'Initial Call' },
  { id: 'pre_licensing', label: 'Pre-Licensing' },
  { id: 'taking_exam', label: 'Taking Exam' },
  { id: 'licensing', label: 'Licensing' },
  { id: 'contracting', label: 'Contracting' },
  { id: 'onboarding_complete', label: 'Complete' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A–Z)' },
  { value: 'name_desc', label: 'Name (Z–A)' },
  { value: 'phase_asc', label: 'Phase (earliest first)' },
  { value: 'phase_desc', label: 'Phase (furthest first)' },
  { value: 'progress_asc', label: 'Progress (lowest first)' },
  { value: 'progress_desc', label: 'Progress (highest first)' },
  { value: 'activity_desc', label: 'Last Activity (newest)' },
  { value: 'activity_asc', label: 'Last Activity (oldest)' },
];

const PHASE_ORDER = ['initial_call', 'pre_licensing', 'taking_exam', 'licensing', 'contracting', 'onboarding_complete'];

const PHASE_COLUMN_COLORS = {
  initial_call:        { header: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',       badge: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100',    body: 'bg-blue-50 dark:bg-blue-950/30' },
  pre_licensing:       { header: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200', badge: 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100', body: 'bg-indigo-50 dark:bg-indigo-950/30' },
  taking_exam:         { header: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200', badge: 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-100', body: 'bg-purple-50 dark:bg-purple-950/30' },
  licensing:           { header: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200', badge: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100', body: 'bg-yellow-50 dark:bg-yellow-950/30' },
  contracting:         { header: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200', badge: 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-100', body: 'bg-orange-50 dark:bg-orange-950/30' },
  onboarding_complete: { header: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200',   badge: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100',  body: 'bg-green-50 dark:bg-green-950/30' },
};

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState('all');
  const [filterAgency, setFilterAgency] = useState('all');
  const [filterUpline, setFilterUpline] = useState('all');
  const [filterCompletion, setFilterCompletion] = useState('all');
  const [sortBy, setSortBy] = useState('activity_desc');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      setUser(currentUser);
      if (currentUser?.user_type === 'agent') {
        navigate(createPageUrl('AgentPortal'));
      }
    });
  }, [navigate]);

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

  // Fetch all progress records for manager's agents
  const { data: allProgress = [] } = useQuery({
    queryKey: ['allAgentProgress', agentIds],
    queryFn: async () => {
      if (agentIds.length === 0) return [];
      try {
        return await base44.entities.AgentActionProgress.list();
      } catch {
        return [];
      }
    },
    enabled: agentIds.length > 0,
  });

  // Map agent id -> progress percent
  const progressMap = useMemo(() => {
    const map = {};
    for (const agent of agents) {
      const agentProgress = allProgress.filter(p => p.agent_id === agent.id && p.phase === agent.phase);
      map[agent.id] = calcProgressPercent(agent.phase, agentProgress);
    }
    return map;
  }, [agents, allProgress]);

  // Unique agencies and uplines for filter dropdowns
  const agencies = useMemo(() => {
    const set = new Set(agents.map(a => a.agency_name).filter(Boolean));
    return [...set].sort();
  }, [agents]);

  const uplines = useMemo(() => {
    const set = new Set(agents.map(a => a.direct_upline).filter(Boolean));
    return [...set].sort();
  }, [agents]);

  const filteredAndSorted = useMemo(() => {
    let list = agents.filter(agent => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        agent.first_name?.toLowerCase().includes(q) ||
        agent.last_name?.toLowerCase().includes(q) ||
        agent.email?.toLowerCase().includes(q) ||
        agent.agency_name?.toLowerCase().includes(q) ||
        agent.direct_upline?.toLowerCase().includes(q);

      const matchesPhase = filterPhase === 'all' || agent.phase === filterPhase;
      const matchesAgency = filterAgency === 'all' || agent.agency_name === filterAgency;
      const matchesUpline = filterUpline === 'all' || agent.direct_upline === filterUpline;

      const pct = progressMap[agent.id] ?? 0;
      const matchesCompletion =
        filterCompletion === 'all' ? true :
        filterCompletion === 'complete' ? pct === 100 :
        filterCompletion === 'in_progress' ? pct > 0 && pct < 100 :
        filterCompletion === 'not_started' ? pct === 0 : true;

      return matchesSearch && matchesPhase && matchesAgency && matchesUpline && matchesCompletion;
    });

    list = [...list].sort((a, b) => {
      const pctA = progressMap[a.id] ?? 0;
      const pctB = progressMap[b.id] ?? 0;
      switch (sortBy) {
        case 'name_asc': return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'name_desc': return `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`);
        case 'phase_asc': return PHASE_ORDER.indexOf(a.phase) - PHASE_ORDER.indexOf(b.phase);
        case 'phase_desc': return PHASE_ORDER.indexOf(b.phase) - PHASE_ORDER.indexOf(a.phase);
        case 'progress_asc': return pctA - pctB;
        case 'progress_desc': return pctB - pctA;
        case 'activity_desc': return new Date(b.updated_date || 0) - new Date(a.updated_date || 0);
        case 'activity_asc': return new Date(a.updated_date || 0) - new Date(b.updated_date || 0);
        default: return 0;
      }
    });

    return list;
  }, [agents, searchTerm, filterPhase, filterAgency, filterUpline, filterCompletion, sortBy, progressMap]);

  const hasActiveFilters = searchTerm || filterPhase !== 'all' || filterAgency !== 'all' || filterUpline !== 'all' || filterCompletion !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPhase('all');
    setFilterAgency('all');
    setFilterUpline('all');
    setFilterCompletion('all');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 pt-20">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Pipeline</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your agents through the onboarding process</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(createPageUrl('ManagerSettings'))}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('AgentIntake'))}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Agent
            </Button>
          </div>
        </div>

        {/* Phase Summary Bar */}
        {agents.length > 0 && <PhaseSummaryBar agents={agents} />}

        {/* Search, Filters & Sort */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, agency, upline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Sort */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-3">
            <Select value={filterPhase} onValueChange={setFilterPhase}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Phases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                {PHASES.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterCompletion} onValueChange={setFilterCompletion}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Completion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Completion</SelectItem>
                <SelectItem value="not_started">Not Started (0%)</SelectItem>
                <SelectItem value="in_progress">In Progress (1–99%)</SelectItem>
                <SelectItem value="complete">Fully Complete (100%)</SelectItem>
              </SelectContent>
            </Select>

            {agencies.length > 0 && (
              <Select value={filterAgency} onValueChange={setFilterAgency}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agencies</SelectItem>
                  {agencies.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {uplines.length > 0 && (
              <Select value={filterUpline} onValueChange={setFilterUpline}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Uplines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Uplines</SelectItem>
                  {uplines.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <X className="w-4 h-4 mr-1" />
                Clear filters
              </Button>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{filteredAndSorted.length}</span> of {agents.length} agents
          </p>
        </div>

        {/* Kanban Board */}
        {agents.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No agents yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by adding your first agent</p>
            <Button onClick={() => navigate(createPageUrl('AgentIntake'))} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />Add New Agent
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {PHASES.map(phase => {
                const columnAgents = filteredAndSorted.filter(a => a.phase === phase.id);
                const phaseConfig = PHASE_COLUMN_COLORS[phase.id];
                return (
                  <div key={phase.id} className="w-72 flex-shrink-0">
                    {/* Column header */}
                    <div className={`rounded-t-lg px-4 py-3 ${phaseConfig.header}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{phase.label}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${phaseConfig.badge}`}>
                          {columnAgents.length}
                        </span>
                      </div>
                    </div>
                    {/* Column body */}
                    <div className={`rounded-b-lg min-h-40 p-2 space-y-2 ${phaseConfig.body}`}>
                      {columnAgents.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-6">No agents</div>
                      ) : (
                        columnAgents.map(agent => (
                          <AgentCard
                            key={agent.id}
                            agent={agent}
                            progressPercent={progressMap[agent.id] ?? 0}
                            onClick={(a) => navigate(createPageUrl('AgentDetail') + '?id=' + a.id)}
                            compact
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}