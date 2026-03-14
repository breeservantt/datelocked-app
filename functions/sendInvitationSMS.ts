import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    console.log('Invitation request received');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('Unauthorized invitation attempt');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.email);

    const { email } = await req.json();

    if (!email) {
      console.error('Missing email parameter');
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }
    
    if (!email.includes('@')) {
      console.error('Invalid email format:', email);
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }
    
    console.log('Sending invitation to:', email);

    // Generate unique invitation token
    const invitationToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Use service role for all operations to avoid restrictions
    const invitation = await base44.asServiceRole.entities.RelationshipInvitation.create({
      sender_email: user.email,
      sender_name: user.full_name || user.email,
      recipient_email: email,
      invitation_token: invitationToken,
      status: 'pending',
      expires_at: expiresAt.toISOString()
    });

    // Update sender's status with service role
    await base44.asServiceRole.entities.User.update(user.id, {
      relationship_status: 'pending_verification',
      partner_email: email
    });

    const appUrl = new URL(req.url).origin;
    const invitationLink = `${appUrl}?invite=${invitationToken}`;

    // Send email using service role to allow external emails
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'Date-Locked',
      to: email,
      subject: '💕 You\'re invited to Date-Lock on Date-Locked!',
      body: `Hi there!

${user.full_name || user.email} has invited you to Date-Lock your relationship on Date-Locked.

Click the link below to accept and make your relationship official:
${invitationLink}

This invitation expires in 7 days.

The Date-Locked Team`
    });

    console.log('Invitation email sent successfully to:', email);
    console.log('Invitation link:', invitationLink);

    return Response.json({
      success: true,
      invitation_id: invitation.id,
      link: invitationLink,
      email: email
    });
  } catch (error) {
    console.error('Email invitation error:', error);
    console.error('Error stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Failed to send invitation email',
      details: error.stack
    }, { status: 500 });
  }
});