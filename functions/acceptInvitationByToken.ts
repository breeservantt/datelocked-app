import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitation_token } = await req.json();

    if (!invitation_token) {
      return Response.json({ error: 'Invitation token is required' }, { status: 400 });
    }

    // Get the invitation by token
    const { data: invitations, error: invitationError } = await supabase
      .from('RelationshipInvitation')
      .select('*')
      .eq('invitation_token', invitation_token)
      .eq('status', 'pending');

    if (invitationError) {
      throw invitationError;
    }

    if (!invitations || invitations.length === 0) {
      return Response.json({ error: 'Invitation not found or expired' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Check if invitation expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('RelationshipInvitation')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return Response.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Create couple profile
    const { data: coupleProfile, error: coupleError } = await supabase
      .from('CoupleProfile')
      .insert({
        partner1_email: invitation.sender_email,
        partner2_email: user.email,
        date_locked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (coupleError) {
      throw coupleError;
    }

    // Update invitation status
    await supabase
      .from('RelationshipInvitation')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);

    // Update sender user
    const { data: senderUsers, error: senderError } = await supabase
      .from('User')
      .select('*')
      .eq('email', invitation.sender_email);

    if (senderError) {
      throw senderError;
    }

    if (senderUsers && senderUsers.length > 0) {
      await supabase
        .from('User')
        .update({
          relationship_status: 'date_locked',
          partner_email: user.email,
          couple_profile_id: coupleProfile.id,
        })
        .eq('id', senderUsers[0].id);
    }

    // Update current authenticated user (replacement for base44.auth.updateMe)
    await supabase
      .from('User')
      .update({
        relationship_status: 'date_locked',
        partner_email: invitation.sender_email,
        couple_profile_id: coupleProfile.id,
      })
      .eq('id', user.id);

    // Send notification email (REPLACE WITH YOUR EMAIL SERVICE)
    try {
      // Example placeholder
      // await sendEmail({...})
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
    }

    return Response.json({
      success: true,
      couple_profile_id: coupleProfile.id,
    });

  } catch (error) {
    console.error('Accept invitation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
