import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Video, Link as LinkIcon, ExternalLink } from 'lucide-react';

const typeIcons = {
  document: FileText,
  video: Video,
  link: LinkIcon
};

const typeColors = {
  document: 'bg-blue-100 text-blue-800',
  video: 'bg-purple-100 text-purple-800',
  link: 'bg-green-100 text-green-800'
};

export default function ResourceCard({ resource }) {
  const Icon = typeIcons[resource.type];
  
  const handleOpen = () => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleOpen}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${typeColors[resource.type]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{resource.title}</CardTitle>
              {resource.description && (
                <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      {resource.file_url && (
        <CardContent>
          <Button
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Resource
          </Button>
        </CardContent>
      )}
    </Card>
  );
}