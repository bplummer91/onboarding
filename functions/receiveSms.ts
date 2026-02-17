import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const formData = await req.formData();

    const from = formData.get('From');
    const to = formData.get('To');
    const body = formData.get('Body');
    const sid = formData.get('MessageSid');

    if (!from || !body) {
      return new Response('<Response/>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // Find the agent by phone number
    const allAgents = await base44.asServiceRole.entities.Agent.list();
    const agent = allAgents.find(a => {
      const normalized = a.phone?.replace(/\D/g, '');
      const incomingNormalized = from.replace(/\D/g, '');
      return normalized && incomingNormalized.endsWith(normalized) || normalized === incomingNormalized;
    });

    if (!agent) {
      return new Response('<Response/>', { headers: { 'Content-Type': 'text/xml' } });
    }

    // Find the manager who owns this Twilio number
    const allUsers = await base44.asServiceRole.entities.User.list();
    const manager = allUsers.find(u => {
      const normalized = u.twilio_phone_number?.replace(/\D/g, '');
      const toNormalized = to?.replace(/\D/g, '');
      return normalized && toNormalized && (toNormalized.endsWith(normalized) || normalized === toNormalized);
    });

    await base44.asServiceRole.entities.SmsMessage.create({
      agent_id: agent.id,
      direction: 'inbound',
      body: body,
      from_number: from,
      to_number: to,
      manager_email: manager?.email || '',
      twilio_sid: sid,
    });

    return new Response('<Response/>', { headers: { 'Content-Type': 'text/xml' } });
  } catch (error) {
    console.error('receiveSms error:', error);
    return new Response('<Response/>', { headers: { 'Content-Type': 'text/xml' } });
  }
});