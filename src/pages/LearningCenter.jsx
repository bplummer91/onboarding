import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Search, BookOpen } from 'lucide-react';
import ResourceCard from '../components/resources/ResourceCard';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LearningCenter() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState('all');

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

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

  const { data: allResources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
  });

  const resources = allResources
    .filter(r => agent && r.phases?.includes(agent.phase))
    .filter(r => {
      const matchesSearch = 
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = activeType === 'all' || r.type === activeType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const typeCounts = {
    all: resources.length,
    document: resources.filter(r => r.type === 'document').length,
    video: resources.filter(r => r.type === 'video').length,
    link: resources.filter(r => r.type === 'link').length,
  };

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('AgentPortal'))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portal
        </Button>

        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Learning Center</h1>
            <p className="text-gray-600">
              Resources for your current phase: <span className="font-semibold capitalize">{agent.phase}</span>
            </p>
          </div>
        </div>

        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={activeType} onValueChange={setActiveType} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-4 w-full md:w-auto">
                  <TabsTrigger value="all">All ({typeCounts.all})</TabsTrigger>
                  <TabsTrigger value="document">Docs ({typeCounts.document})</TabsTrigger>
                  <TabsTrigger value="video">Videos ({typeCounts.video})</TabsTrigger>
                  <TabsTrigger value="link">Links ({typeCounts.link})</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {resources.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Check back soon for new learning materials'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map(resource => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}