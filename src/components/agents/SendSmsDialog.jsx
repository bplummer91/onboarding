import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function SendSmsDialog({ agent }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!agent.phone) {
      toast.error('This agent has no phone number on file.');
      return;
    }
    setSending(true);
    const res = await base44.functions.invoke('sendSms', { to: agent.phone, message, agentId: agent.id });
    setSending(false);
    if (res.data?.success) {
      toast.success('SMS sent successfully!');
      setMessage('');
      setOpen(false);
    } else {
      toast.error(res.data?.error || 'Failed to send SMS');
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <MessageSquare className="w-4 h-4 mr-2" />
        Send SMS
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send SMS to {agent.first_name} {agent.last_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-500">To: {agent.phone || 'No phone number'}</p>
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}