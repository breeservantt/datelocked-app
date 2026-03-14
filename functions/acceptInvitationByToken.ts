import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitation_token } = await req.json();

    if (!invitation_token) {
      return Response.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    // Get the invitation by token
    const invitations = await base44.asServiceRole.entities.RelationshipInvitation.filter({ 
      invitation_token: invitation_token,
      status: 'pending'
    });

    if (invitations.length === 0) {
      return Response.json({ error: 'Invitation not found or expired' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Check if invitation expired
    if (new Date(invitation.expires_at) < new Date()) {
      await base44.asServiceRole.entities.RelationshipInvitation.update(invitation.id, {
        status: 'expired'
      });
      return Response.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Create couple profile
    const coupleProfile = await base44.asServiceRole.entities.CoupleProfile.create({
      partner1_email: invitation.sender_email,
      partner2_email: user.email,
      date_locked_at: new Date().toISOString()
    });

    // Update invitation status
    await base44.asServiceRole.entities.RelationshipInvitation.update(invitation.id, {
      status: 'accepted'
    });

    // Update both users to date_locked status
    const senderUsers = await base44.asServiceRole.entities.User.filter({
      email: invitation.sender_email
    });
    
    if (senderUsers.length > 0) {
      await base44.asServiceRole.entities.User.update(senderUsers[0].id, {
        relationship_status: 'date_locked',
        partner_email: user.email,
        couple_profile_id: coupleProfile.id
      });
    }

    await base44.auth.updateMe({
      relationship_status: 'date_locked',
      partner_email: invitation.sender_email,
      couple_profile_id: coupleProfile.id
    });

    // Send notification email to sender using service role
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: invitation.sender_email,
        subject: '🔐 You are now Date-Locked!',
        body: `Great news! ${user.full_name || 'Your partner'} has accepted your Date-Lock invitation. You are now officially Date-Locked together!`
      });
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    return Response.json({ 
      success: true,
      couple_profile_id: coupleProfile.id 
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});