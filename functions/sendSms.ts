import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, message } = await req.json();

    if (!to || !message) {
      return Response.json({ error: 'Missing required fields: to, message' }, { status: 400 });
    }

    const accountSid = user.twilio_account_sid;
    const authToken = user.twilio_auth_token;
    const fromNumber = user.twilio_phone_number;

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ error: 'Twilio credentials not configured. Please set up your Twilio settings.' }, { status: 400 });
    }

    const credentials = btoa(`${accountSid}:${authToken}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: to, From: fromNumber, Body: message }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data.message || 'Failed to send SMS' }, { status: 400 });
    }

    // Save outbound message to database
    const { agentId } = await req.json().catch(() => ({}));
    if (agentId) {
      await base44.asServiceRole.entities.SmsMessage.create({
        agent_id: agentId,
        direction: 'outbound',
        body: message,
        from_number: fromNumber,
        to_number: to,
        manager_email: user.email,
        twilio_sid: data.sid,
      });
    }

    return Response.json({ success: true, sid: data.sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});