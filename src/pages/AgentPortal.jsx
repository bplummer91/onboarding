import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import PhaseIndicator from '../components/agents/PhaseIndicator';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const phaseInfo = {
  initial_call: {
    title: 'Initial Call',
    description: 'Welcome! We\'re excited to begin your journey with us.',
    nextSteps: ['Complete your initial information form', 'Review the welcome materials', 'Schedule your enrollment call']
  },
  pre_licensing: {
    title: 'Pre-Licensing',
    description: 'Prepare for your licensing journey. Complete the required training and coursework.',
    nextSteps: ['Access training materials', 'Complete required courses', 'Prepare for the upcoming exam']
  },
  taking_exam: {
    title: 'Taking Exam',
    description: 'Time to demonstrate your knowledge and skills.',
    nextSteps: ['Review study materials', 'Schedule your exam', 'Complete the exam']
  },
  licensing: {
    title: 'Licensing',
    description: 'Get your official license to operate.',
    nextSteps: ['Submit fingerprinting application', 'Complete required documentation', 'Apply for your license']
  },
  contracting: {
    title: 'Contracting',
    description: 'Finalize your contract and prepare to go active.',
    nextSteps: ['Review and sign contract documents', 'Set up payment information', 'Complete final paperwork']
  },
  onboarding_complete: {
    title: 'Onboarding Complete!',
    description: 'Congratulations! You\'re now fully onboarded and ready to work.',
    nextSteps: ['Start taking assignments', 'Continue learning and growing', 'Reach out if you need support']
  }
};

export default function AgentPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(currentUser => {
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
      return allAgents.filter(a => a.email === user.email);
    },
    enabled: !!user,
  });

  const agent = agents[0];

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Onboarding Pending</h2>
            <p className="text-gray-600">
              Your account is being set up. You'll receive an email when your onboarding begins.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentPhaseInfo = phaseInfo[agent.phase];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome, {agent.first_name}!
          </h1>
          <p className="text-lg text-gray-600">Track your onboarding progress and access resources</p>
        </div>

        <Card className="mb-8 border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Your Onboarding Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <PhaseIndicator currentPhase={agent.phase} />
            
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-2">
                {currentPhaseInfo.title}
              </h3>
              <p className="text-blue-700 mb-4">{currentPhaseInfo.description}</p>
              
              <div className="space-y-2">
                <p className="font-medium text-blue-900">Next Steps:</p>
                <ul className="space-y-2">
                  {currentPhaseInfo.nextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-blue-700">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Learning Center</CardTitle>
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Access phase-specific resources, training materials, and documentation
            </p>
            <Button
              onClick={() => navigate(createPageUrl('LearningCenter'))}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              Browse Resources
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}