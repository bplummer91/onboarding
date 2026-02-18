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
      return new Response(null, { status: 204 });
    }

    const incomingNormalized = from.replace(/\D/g, '');

    const allAgents = await base44.asServiceRole.entities.Agent.list();
    const agent = allAgents.find(a => {
      const normalized = a.phone?.replace(/\D/g, '');
      if (!normalized) return false;
      return incomingNormalized.endsWith(normalized) || normalized.endsWith(incomingNormalized);
    });

    if (!agent) {
      console.log('No agent found for number:', from);
      return new Response(null, { status: 204 });
    }

    const existingMessages = await base44.asServiceRole.entities.SmsMessage.filter({ agent_id: agent.id });
    const outbound = existingMessages.find(m => m.direction === 'outbound' && m.manager_email);
    const managerEmail = outbound?.manager_email || '';

    await base44.asServiceRole.entities.SmsMessage.create({
      agent_id: agent.id,
      direction: 'inbound',
      body: body,
      from_number: from,
      to_number: to || '',
      manager_email: managerEmail,
      twilio_sid: sid || '',
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('receiveSms error:', error.message);
    return new Response(null, { status: 204 });
  }
});