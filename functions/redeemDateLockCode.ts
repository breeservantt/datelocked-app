import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ error: 'Missing environment variables' }, 500)
    }

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    // Authenticated user client
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Admin client
    const adminClient = createClient(supabaseUrl, serviceKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json()
    const code = body?.code?.toString().trim()

    if (!code) {
      return jsonResponse({ error: 'Code is required' }, 400)
    }

    // Get current user profile
    const { data: currentUser, error: currentUserError } = await adminClient
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single()

    if (currentUserError || !currentUser) {
      return jsonResponse({ error: 'User profile not found' }, 404)
    }

    // Find code
    const { data: codes, error: codeError } = await adminClient
      .from('DateLockCode')
      .select('*')
      .eq('code', code)
      .eq('status', 'active')

    if (codeError) {
      throw codeError
    }

    if (!codes || codes.length === 0) {
      return jsonResponse({ error: 'Invalid or expired code' }, 404)
    }

    const dateLockCode = codes[0]

    // Expiry check
    if (new Date(dateLockCode.expires_at) < new Date()) {
      await adminClient
        .from('DateLockCode')
        .update({ status: 'expired' })
        .eq('id', dateLockCode.id)

      return jsonResponse({ error: 'Code has expired' }, 400)
    }

    // Prevent self-use
    if (dateLockCode.creator_email === user.email) {
      return jsonResponse(
        { error: 'You cannot redeem your own code' },
        400
      )
    }

    // Already locked check
    if (
      currentUser.relationship_status === 'date_locked' &&
      currentUser.couple_profile_id
    ) {
      return jsonResponse(
        { error: 'You are already Date-Locked with someone' },
        400
      )
    }

    // Create couple profile
    const { data: coupleProfile, error: coupleError } = await adminClient
      .from('CoupleProfile')
      .insert({
        partner1_email: dateLockCode.creator_email,
        partner2_email: user.email,
        date_locked_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (coupleError || !coupleProfile) {
      throw coupleError
    }

    // Update code
    await adminClient
      .from('DateLockCode')
      .update({
        status: 'redeemed',
        redeemed_by: user.email,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', dateLockCode.id)

    // Get creator
    const { data: creatorUsers } = await adminClient
      .from('User')
      .select('*')
      .eq('email', dateLockCode.creator_email)

    if (creatorUsers && creatorUsers.length > 0) {
      await adminClient
        .from('User')
        .update({
          relationship_status: 'date_locked',
          partner_email: user.email,
          couple_profile_id: coupleProfile.id,
        })
        .eq('id', creatorUsers[0].id)
    }

    // Update current user
    await adminClient
      .from('User')
      .update({
        relationship_status: 'date_locked',
        partner_email: dateLockCode.creator_email,
        couple_profile_id: coupleProfile.id,
      })
      .eq('id', user.id)

    return jsonResponse({
      success: true,
      couple_profile_id: coupleProfile.id,
      partner_name: dateLockCode.creator_name,
      message: `You are now Date-Locked with ${dateLockCode.creator_name}!`,
    })
  } catch (error) {
    console.error('Redeem Date-Lock code error:', error)

    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
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
