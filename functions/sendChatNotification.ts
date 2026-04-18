import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { recipientEmail, senderName, message } = await req.json();

    if (!recipientEmail || !senderName) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send email notification
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `💬 New message from ${senderName}`,
      body: `You have a new message from ${senderName} on Date-Locked.\n\n${message ? `"${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"` : ''}\n\nLog in to view and reply: https://app.base44.com/your-app`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error sending chat notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});