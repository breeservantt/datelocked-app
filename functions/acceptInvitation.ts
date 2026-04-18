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

    const { invitation_id } = await req.json();

    // Get the invitation
    const { data: invitations, error: invitationError } = await supabase
      .from('RelationshipInvitation')
      .select('*')
      .eq('id', invitation_id)
      .eq('recipient_email', user.email)
      .eq('status', 'pending');

    if (invitationError) {
      throw invitationError;
    }

    if (!invitations || invitations.length === 0) {
      return Response.json({ error: 'Invitation not found' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Create couple profile
    const { data: coupleProfile, error: coupleProfileError } = await supabase
      .from('CoupleProfile')
      .insert({
        partner1_email: invitation.sender_email,
        partner2_email: user.email,
        date_locked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (coupleProfileError) {
      throw coupleProfileError;
    }

    // Update invitation status
    const { error: updateInvitationError } = await supabase
      .from('RelationshipInvitation')
      .update({
        status: 'accepted',
      })
      .eq('id', invitation_id);

    if (updateInvitationError) {
      throw updateInvitationError;
    }

    // Update both users to date_locked status
    const { data: senderUsers, error: senderUsersError } = await supabase
      .from('User')
      .select('*')
      .eq('email', invitation.sender_email);

    if (senderUsersError) {
      throw senderUsersError;
    }

    const { data: recipientUsers, error: recipientUsersError } = await supabase
      .from('User')
      .select('*')
      .eq('email', user.email);

    if (recipientUsersError) {
      throw recipientUsersError;
    }

    if (senderUsers && senderUsers.length > 0) {
      const { error: senderUpdateError } = await supabase
        .from('User')
        .update({
          relationship_status: 'date_locked',
          partner_email: user.email,
          couple_profile_id: coupleProfile.id,
        })
        .eq('id', senderUsers[0].id);

      if (senderUpdateError) {
        throw senderUpdateError;
      }
    }

    if (recipientUsers && recipientUsers.length > 0) {
      const { error: recipientUpdateError } = await supabase
        .from('User')
        .update({
          relationship_status: 'date_locked',
          partner_email: invitation.sender_email,
          couple_profile_id: coupleProfile.id,
        })
        .eq('id', recipientUsers[0].id);

      if (recipientUpdateError) {
        throw recipientUpdateError;
      }
    }

    // Send notification email
    // Replace this with your own email provider implementation
    // Example placeholder:
    // await sendEmail({
    //   to: invitation.sender_email,
    //   subject: '🔐 You are now Date-Locked!',
    //   body: `Great news! ${user.user_metadata?.full_name || 'Your partner'} has accepted your Date-Lock invitation. You are now officially Date-Locked together!`
    // });

    return Response.json({
      success: true,
      couple_profile_id: coupleProfile.id,
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
