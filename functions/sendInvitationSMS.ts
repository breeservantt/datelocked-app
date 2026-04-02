import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Invitation request received')

    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!supabaseUrl || !anonKey || !serviceKey || !resendApiKey) {
      return jsonResponse({ error: 'Missing environment variables' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Unauthorized invitation attempt')
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const adminClient = createClient(supabaseUrl, serviceKey)

    const {
      data: { user: authUser },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !authUser) {
      console.error('Unauthorized invitation attempt')
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: currentUser, error: currentUserError } = await adminClient
      .from('User')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (currentUserError || !currentUser) {
      return jsonResponse({ error: 'User profile not found' }, 404)
    }

    console.log('User authenticated:', currentUser.email || authUser.email)

    const body = await req.json().catch(() => null)
    const email = body?.email?.toString().trim().toLowerCase()

    if (!email) {
      console.error('Missing email parameter')
      return jsonResponse({ error: 'Email is required' }, 400)
    }

    if (!email.includes('@')) {
      console.error('Invalid email format:', email)
      return jsonResponse({ error: 'Invalid email address' }, 400)
    }

    if ((currentUser.email || authUser.email)?.toLowerCase() === email) {
      return jsonResponse({ error: 'You cannot invite yourself' }, 400)
    }

    console.log('Sending invitation to:', email)

    const { data: existingRecipient } = await adminClient
      .from('User')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existingRecipient?.relationship_status === 'date_locked' && existingRecipient?.couple_profile_id) {
      return jsonResponse({ error: 'This user is already Date-Locked' }, 400)
    }

    const { data: existingPending } = await adminClient
      .from('RelationshipInvitation')
      .select('*')
      .eq('sender_email', currentUser.email || authUser.email)
      .eq('recipient_email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return jsonResponse({
        success: true,
        invitation_id: existingPending.id,
        link: `${Deno.env.get('APP_URL') || new URL(req.url).origin}?invite=${existingPending.invitation_token}`,
        email,
      })
    }

    const invitationToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invitation, error: invitationError } = await adminClient
      .from('RelationshipInvitation')
      .insert({
        sender_email: currentUser.email || authUser.email,
        sender_name: currentUser.full_name || authUser.user_metadata?.full_name || currentUser.email || authUser.email,
        recipient_email: email,
        invitation_token: invitationToken,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (invitationError || !invitation) {
      throw invitationError || new Error('Failed to create invitation')
    }

    const { error: updateUserError } = await adminClient
      .from('User')
      .update({
        relationship_status: 'pending_verification',
        partner_email: email,
      })
      .eq('id', currentUser.id)

    if (updateUserError) {
      await adminClient.from('RelationshipInvitation').delete().eq('id', invitation.id)
      throw updateUserError
    }

    const appUrl = Deno.env.get('APP_URL') || new URL(req.url).origin
    const invitationLink = `${appUrl}?invite=${invitationToken}`

    const emailBody = `Hi there!

${currentUser.full_name || currentUser.email || authUser.email} has invited you to Date-Lock your relationship on Date-Locked.

Click the link below to accept and make your relationship official:
${invitationLink}

This invitation expires in 7 days.

The Date-Locked Team`

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Date-Locked <onboarding@resend.dev>',
        to: [email],
        subject: "💕 You're invited to Date-Lock on Date-Locked!",
        text: emailBody,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      await adminClient.from('RelationshipInvitation').delete().eq('id', invitation.id)
      await adminClient
        .from('User')
        .update({
          relationship_status: currentUser.relationship_status || null,
          partner_email: currentUser.partner_email || null,
        })
        .eq('id', currentUser.id)

      throw new Error(`Failed to send invitation email: ${errorText}`)
    }

    console.log('Invitation email sent successfully to:', email)
    console.log('Invitation link:', invitationLink)

    return jsonResponse({
      success: true,
      invitation_id: invitation.id,
      link: invitationLink,
      email,
    })
  } catch (error) {
    console.error('Email invitation error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')

    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Failed to send invitation email',
        details: error instanceof Error ? error.stack : null,
      },
      500
    )
  }
})

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  })
}
