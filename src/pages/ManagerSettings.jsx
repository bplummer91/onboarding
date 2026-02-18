import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Phone, KeyRound, Copy, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function ManagerSettings() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [masterCode, setMasterCode] = useState('');
  const [form, setForm] = useState({
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_phone_number: '',
  });

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user) {
        setMasterCode(user.master_code || '');
        setForm({
          twilio_account_sid: user.twilio_account_sid || '',
          twilio_auth_token: user.twilio_auth_token || '',
          twilio_phone_number: user.twilio_phone_number || '',
        });
      }
    });
  }, []);

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setMasterCode(code);
  };

  const saveMasterCode = async () => {
    setSaving(true);
    await base44.auth.updateMe({ master_code: masterCode });
    setSaving(false);
    toast.success('Master code saved!');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(masterCode);
    toast.success('Copied to clipboard!');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.auth.updateMe(form);
    setSaving(false);
    toast.success('Twilio settings saved!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto pt-14">
        <Button variant="ghost" onClick={() => navigate(createPageUrl('ManagerDashboard'))} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Manage your integrations</p>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-purple-600" />
              <div>
                <CardTitle>Master Code</CardTitle>
                <CardDescription>Your unique code that ties agents to your account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <Input
                value={masterCode}
                onChange={e => setMasterCode(e.target.value)}
                placeholder="No code set yet"
                className="font-mono text-lg tracking-widest"
              />
              <Button type="button" variant="outline" onClick={generateCode} title="Generate new code">
                <RefreshCw className="w-4 h-4" />
              </Button>
              {masterCode && (
                <Button type="button" variant="outline" onClick={copyCode} title="Copy code">
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={saveMasterCode} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Code'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle>Twilio SMS</CardTitle>
                <CardDescription>Enter your Twilio credentials to send SMS messages to agents</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="account_sid">Account SID</Label>
                <Input
                  id="account_sid"
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={form.twilio_account_sid}
                  onChange={e => setForm(prev => ({ ...prev, twilio_account_sid: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auth_token">Auth Token</Label>
                <Input
                  id="auth_token"
                  type="password"
                  placeholder="Your Twilio Auth Token"
                  value={form.twilio_auth_token}
                  onChange={e => setForm(prev => ({ ...prev, twilio_auth_token: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">From Phone Number</Label>
                <Input
                  id="phone_number"
                  placeholder="+15551234567"
                  value={form.twilio_phone_number}
                  onChange={e => setForm(prev => ({ ...prev, twilio_phone_number: e.target.value }))}
                />
                <p className="text-xs text-gray-500">Must be a Twilio number in E.164 format (e.g. +15551234567)</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}