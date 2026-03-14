import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitation_id } = await req.json();

    // Get the invitation
    const invitations = await base44.asServiceRole.entities.RelationshipInvitation.filter({ 
      id: invitation_id,
      recipient_email: user.email,
      status: 'pending'
    });

    if (invitations.length === 0) {
      return Response.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Create couple profile
    const coupleProfile = await base44.asServiceRole.entities.CoupleProfile.create({
      partner1_email: invitation.sender_email,
      partner2_email: user.email,
      date_locked_at: new Date().toISOString()
    });

    // Update invitation status
    await base44.asServiceRole.entities.RelationshipInvitation.update(invitation_id, {
      status: 'accepted'
    });

    // Update both users to date_locked status
    const senderUsers = await base44.asServiceRole.entities.User.filter({
      email: invitation.sender_email
    });
    
    const recipientUsers = await base44.asServiceRole.entities.User.filter({
      email: user.email
    });

    if (senderUsers.length > 0) {
      await base44.asServiceRole.entities.User.update(senderUsers[0].id, {
        relationship_status: 'date_locked',
        partner_email: user.email,
        couple_profile_id: coupleProfile.id
      });
    }

    if (recipientUsers.length > 0) {
      await base44.asServiceRole.entities.User.update(recipientUsers[0].id, {
        relationship_status: 'date_locked',
        partner_email: invitation.sender_email,
        couple_profile_id: coupleProfile.id
      });
    }

    // Send notification email
    await base44.integrations.Core.SendEmail({
      to: invitation.sender_email,
      subject: '🔐 You are now Date-Locked!',
      body: `Great news! ${user.full_name} has accepted your Date-Lock invitation. You are now officially Date-Locked together!`
    });

    return Response.json({ 
      success: true,
      couple_profile_id: coupleProfile.id 
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});