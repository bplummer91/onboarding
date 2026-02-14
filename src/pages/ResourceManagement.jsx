import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Upload, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import ResourceCard from '../components/resources/ResourceCard';

const phases = [
  { id: 'initial_call', label: 'Initial Call' },
  { id: 'enrolled_in_xcel', label: 'Enrolled in Xcel' },
  { id: 'taking_exam', label: 'Taking Exam' },
  { id: 'licensing', label: 'Licensing' },
  { id: 'contracting', label: 'Contracting' },
  { id: 'onboarding_complete', label: 'Onboarding Complete' }
];

export default function ResourceManagement() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    file_url: '',
    phases: [],
    order: 0
  });

  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => base44.entities.Resource.list(),
  });

  const createResourceMutation = useMutation({
    mutationFn: (data) => base44.entities.Resource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources']);
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        type: 'document',
        file_url: '',
        phases: [],
        order: 0
      });
      toast.success('Resource created successfully!');
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id) => base44.entities.Resource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['resources']);
      toast.success('Resource deleted');
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, file_url }));
    setUploading(false);
    toast.success('File uploaded!');
  };

  const handlePhaseToggle = (phaseId) => {
    setFormData(prev => ({
      ...prev,
      phases: prev.phases.includes(phaseId)
        ? prev.phases.filter(p => p !== phaseId)
        : [...prev.phases, phaseId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.phases.length === 0) {
      toast.error('Please select at least one phase');
      return;
    }
    createResourceMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resource Management</h1>
            <p className="text-gray-600 mt-1">Upload and manage learning center resources</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Resource
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>New Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="link">Link</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>File / URL *</Label>
                  {formData.type === 'link' ? (
                    <div className="flex gap-2">
                      <LinkIcon className="w-5 h-5 text-gray-400 mt-2" />
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={formData.file_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value }))}
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        accept={formData.type === 'video' ? 'video/*' : '*'}
                      />
                      {uploading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
                      {formData.file_url && !uploading && (
                        <p className="text-sm text-green-600 mt-2">✓ File uploaded</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Visible in Phases *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {phases.map(phase => (
                      <div key={phase.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={phase.id}
                          checked={formData.phases.includes(phase.id)}
                          onCheckedChange={() => handlePhaseToggle(phase.id)}
                        />
                        <Label htmlFor={phase.id} className="cursor-pointer">
                          {phase.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createResourceMutation.isPending || uploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Create Resource
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map(resource => (
            <div key={resource.id} className="relative">
              <ResourceCard resource={resource} />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => deleteResourceMutation.mutate(resource.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}