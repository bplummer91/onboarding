import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import PhaseIndicator from '../components/agents/PhaseIndicator';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * AgentPortal (Enhanced Next Steps)
 *
 * Changes vs existing:
 * - Replaces static phaseInfo.nextSteps with dynamic "action items" per phase
 *   (sourced from your Canva First 100 Days Binder links + tasks)
 * - Shows completion state using Base44 AgentActionProgress if available
 *   (falls back to localStorage so it won't break during rollout)
 * - Learning Center button deep-links to the agent’s phase:
 *    /LearningCenter?phase=<agent.phase>
 */

// Keep the title/description blocks (these were already in your file)
const phaseInfo = {
  initial_call: {
    title: 'Initial Call',
    description: "Welcome! We're excited to begin your journey with us."
  },
  pre_licensing: {
    title: 'Pre-Licensing',
    description: 'Prepare for your licensing journey. Complete the required training and coursework.'
  },
  taking_exam: {
    title: 'Taking Exam',
    description: 'Time to demonstrate your knowledge and skills.'
  },
  licensing: {
    title: 'Licensing',
    description: 'Get your official license to operate.'
  },
  contracting: {
    title: 'Contracting',
    description: 'Finalize your contract and prepare to go active.'
  },
  onboarding_complete: {
    title: 'Onboarding Complete!',
    description: "Congratulations! You're now fully onboarded and ready to work."
  }
};

// Action items (phase-based) derived from your Canva binder content + links
// NOTE: This is intentionally the same “source of truth” idea you used in LearningCenter.
const ACTION_ITEMS_BY_PHASE = {
  initial_call: [
  {
    key: 'initial_call.create_work_email',
    order: 10,
    title: 'Create your work email',
    description: 'Create a work email in this format: FirstLast.pinnacle@gmail.com.',
    link_url: null,
    required: true
  },
  {
    key: 'initial_call.connect_onboarding_manager',
    order: 20,
    title: 'Connect with your onboarding manager',
    description: 'Send a quick intro message and confirm your next checkpoint.',
    link_url: null,
    required: true
  },
  {
    key: 'initial_call.join_discord',
    order: 30,
    title: 'Join the Pinnacle Discord',
    description: 'Join Discord and confirm you can see announcements and training rooms.',
    link_url: 'https://discord.gg/pinnaclelifegroup',
    required: true
  }],


  pre_licensing: [
  {
    key: 'pre_licensing.sign_up_xcel',
    order: 10,
    title: 'Sign up for Xcel Solutions',
    description: 'Start your pre-licensing course to prepare for the state exam.',
    link_url:
    'https://www.xcelsolutions.com/?utm_campaign=WS%20-%20National%20-%20Brand&utm_content=Brand&utm_source=google&utm_medium=g&utm_term=xcel%20solutions&utm_id=19187571241&matchtype=e&network=g&device=c&gad_source=1&gad_campaignid=19187571241&gbraid=0AAAAACtEPw-bwRdjqeLJqFfIeZSgMVqgb&gclid=Cj0KCQjwm93DBhD_ARIsADR_DjGRHap_XJXbhQixGo7pIDlEepY7_j6xqRohCQGSboQgy8m2yTNl87IaAj8XEALw_wcB',
    required: true
  },
  {
    key: 'pre_licensing.finish_course_fast',
    order: 20,
    title: 'Complete the pre-licensing course quickly',
    description: 'Goal: complete in 2 weeks or less. Treat it like a sprint.',
    link_url: null,
    required: true
  },
  {
    key: 'pre_licensing.schedule_exam',
    order: 30,
    title: 'Schedule your state exam',
    description: 'Schedule your exam no more than 2 weeks out.',
    link_url: 'http://prepare2pass.com/requirements',
    required: true
  }],


  taking_exam: [
  {
    key: 'taking_exam.confirm_exam_requirements',
    order: 10,
    title: 'Confirm exam requirements',
    description: 'Verify location, time, ID requirements, and arrival window.',
    link_url: 'http://prepare2pass.com/requirements',
    required: true
  },
  {
    key: 'taking_exam.take_exam',
    order: 20,
    title: 'Take your state exam',
    description: 'After you finish, record your result immediately.',
    link_url: null,
    required: true
  },
  {
    key: 'taking_exam.disclosures_ready',
    order: 30,
    title: 'Prepare disclosures (if applicable)',
    description: 'If you have a felony/misdemeanor or other disclosures, gather documents early.',
    link_url: null,
    required: false
  }],


  licensing: [
  {
    key: 'licensing.apply_for_license',
    order: 10,
    title: 'Apply for your license',
    description: 'Apply after you pass (complete fingerprints if your state requires it).',
    link_url: 'http://prepare2pass.com/requirements',
    required: true
  },
  {
    key: 'licensing.print_license',
    order: 20,
    title: 'Print/save your active license',
    description: 'Once active, print/save a copy of your license for contracting.',
    link_url: 'https://nipr.com/help/print-your-license',
    required: true
  },
  {
    key: 'licensing.lookup_npn',
    order: 30,
    title: 'Look up and save your NPN',
    description: 'Find your NPN and keep it handy for contracting.',
    link_url: 'https://nipr.com/help/look-up-your-npn',
    required: true
  }],


  contracting: [
  {
    key: 'contracting.banking_info',
    order: 10,
    title: 'Prepare banking information',
    description: 'Voided check OR direct deposit slip (name, address, bank, routing, account).',
    link_url: null,
    required: true
  },
  {
    key: 'contracting.purchase_eo',
    order: 20,
    title: 'Purchase E&O insurance',
    description: 'E&O is required before submitting contracting.',
    link_url: null,
    required: true
  },
  {
    key: 'contracting.contracting_course',
    order: 30,
    title: 'Complete the Contracting Walkthrough Course',
    description: 'Complete the course, then notify admin to submit your contracting ticket.',
    link_url: 'https://pinnaclelife.mykajabi.com/offers/eZkY6zDx/checkout',
    required: true
  }],


  onboarding_complete: [
  {
    key: 'complete.enroll_new_agent_academy',
    order: 10,
    title: 'Enroll in New Agent Academy',
    description: 'Complete pre-recorded modules and attend next live training.',
    link_url: 'https://register.pinnacleagentsuccess.com',
    required: true
  },
  {
    key: 'complete.book_of_business_tracker',
    order: 20,
    title: 'Start your Book of Business tracker',
    description: 'Track every client, policy details, beneficiary info, notes, and paid status.',
    link_url:
    'https://docs.google.com/spreadsheets/d/1_3H80JHMstpHt_-xYMZfh604b_wXq0BAIEOnRQvpaxE/edit?usp=sharing',
    required: true
  },
  {
    key: 'complete.agent_portal_link',
    order: 30,
    title: 'Bookmark the Agent Portal',
    description: 'Use this for day-to-day access.',
    link_url: 'https://pinnacleagentportal.com',
    required: false
  }]

};

function safeLocalStorageKey(agentId, phase) {
  return `agentPortal.actionProgress.${agentId || 'unknown'}.${phase || 'unknown'}`;
}

export default function AgentPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then((currentUser) => {
      setUser(currentUser);
      if (currentUser?.user_type === 'manager') {
        navigate(createPageUrl('ManagerDashboard'));
      }
    });
  }, [navigate]);

  const { data: agents = [] } = useQuery({
    queryKey: ['myAgent', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const allAgents = await base44.entities.Agent.list();
      return allAgents.filter((a) => a.email === user.email);
    },
    enabled: !!user
  });

  const agent = agents[0];

  // Load action progress (Base44 if available, otherwise localStorage fallback)
  const { data: actionProgress = [] } = useQuery({
    queryKey: ['agentActionProgress_portal', agent?.id, agent?.phase],
    queryFn: async () => {
      if (!agent?.id || !agent?.phase) return [];

      // fallback localStorage
      const fallback = () => {
        try {
          const raw = localStorage.getItem(safeLocalStorageKey(agent.id, agent.phase));
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      try {
        const all = await base44.entities.AgentActionProgress.list();
        return (all || []).filter((p) => p.agent_id === agent.id && p.phase === agent.phase);
      } catch {
        return fallback();
      }
    },
    enabled: !!agent?.id && !!agent?.phase
  });

  const completedMap = useMemo(() => {
    const map = {};
    for (const p of actionProgress || []) {
      if (p?.action_key) map[p.action_key] = !!p.completed; // Base44 shape
      if (p?.key) map[p.key] = !!p.completed; // localStorage shape
    }
    return map;
  }, [actionProgress]);

  const currentPhaseInfo = phaseInfo[agent?.phase] || {
    title: 'Onboarding',
    description: 'Track your onboarding progress and access resources.'
  };

  const phaseActionItems = useMemo(() => {
    const items = ACTION_ITEMS_BY_PHASE[agent?.phase] || [];
    return [...items].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [agent?.phase]);

  const requiredItems = useMemo(
    () => phaseActionItems.filter((a) => a.required !== false),
    [phaseActionItems]
  );

  const completedRequiredCount = useMemo(() => {
    return requiredItems.reduce((acc, item) => acc + (completedMap[item.key] ? 1 : 0), 0);
  }, [requiredItems, completedMap]);

  // Show the most important “next 3” required items
  const nextThree = useMemo(() => {
    const req = requiredItems.length ? requiredItems : phaseActionItems;
    return req.slice(0, 3);
  }, [requiredItems, phaseActionItems]);

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Onboarding Pending</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Your account is being set up. You'll receive an email when your onboarding begins.
            </p>
          </CardContent>
        </Card>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome, {agent.first_name}!</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Track your onboarding progress and access resources</p>
        </div>

        <Card className="mb-8 border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Your Onboarding Journey</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <PhaseIndicator currentPhase={agent.phase} />

            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-200 mb-2">{currentPhaseInfo.title}</h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-2">{currentPhaseInfo.description}</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <span className="font-semibold">{completedRequiredCount}</span>/{requiredItems.length || 0}{' '}
                    required action items completed
                  </p>
                </div>

                <Button
                  onClick={() => navigate(`${createPageUrl('LearningCenter')}?phase=${encodeURIComponent(agent.phase)}`)}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg">

                  <BookOpen className="w-5 h-5 mr-2" />
                  Open Learning Center
                </Button>
              </div>

              <div className="mt-5 space-y-2">
                <p className="font-medium text-blue-900 dark:text-blue-200">Next Steps:</p>

                {nextThree.length === 0 ?
                <p className="text-blue-700 dark:text-blue-300">No action items configured for this phase yet.</p> :

                <ul className="space-y-3">
                    {nextThree.map((item) => {
                    const done = !!completedMap[item.key];
                    return (
                      <li key={item.key} className="flex items-start justify-between gap-3 text-blue-700 dark:text-blue-300">
                          <div className="flex items-start gap-2">
                            <CheckCircle2
                            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${done ? 'text-emerald-600' : ''}`} />

                            <div>
                              <div className={`${done ? 'line-through text-blue-500' : ''}`}>{item.title}</div>
                              {item.description &&
                            <div className="text-xs text-blue-600 mt-0.5">{item.description}</div>
                            }
                            </div>
                          </div>

                          {item.link_url ?
                        <Button
                          variant="outline"
                          className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                          onClick={() => window.open(item.link_url, '_blank', 'noopener,noreferrer')}>

                              <ExternalLink className="w-4 h-4 mr-2" />
                              Link
                            </Button> :
                        null}
                        </li>);

                  })}
                  </ul>
                }
              </div>

              <div className="mt-5">
                <Button
                  variant="outline"
                  className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"
                  onClick={() => navigate(`${createPageUrl('LearningCenter')}?phase=${encodeURIComponent(agent.phase)}`)}>

                  View all action items + resources
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        

















      </div>
    </div>);

}