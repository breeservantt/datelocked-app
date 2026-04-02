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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const adminClient = createClient(supabaseUrl, serviceKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const { data: currentUser } = await adminClient
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single()

    const { action, code } = await req.json()

    // ===== GENERATE CODE =====
    if (action === 'generate') {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

      await adminClient
        .from('User')
        .update({
          verification_code: verificationCode,
          verification_code_expires: expiresAt.toISOString(),
        })
        .eq('id', currentUser.id)

      return jsonResponse({
        code: verificationCode,
        expiresAt: expiresAt.toISOString(),
      })
    }

    // ===== VALIDATE CODE =====
    if (action === 'validate') {
      const isPremium =
        currentUser.subscription_tier === 'premium' &&
        currentUser.subscription_expires &&
        new Date(currentUser.subscription_expires) > new Date()

      if (!isPremium) {
        const today = new Date().toISOString().split('T')[0]
        const resetMonth = today.substring(0, 7)

        let used = currentUser.verifications_used_this_month || 0

        if (!currentUser.verifications_reset_date || currentUser.verifications_reset_date !== resetMonth) {
          used = 0
          await adminClient
            .from('User')
            .update({
              verifications_used_this_month: 0,
              verifications_reset_date: resetMonth,
            })
            .eq('id', currentUser.id)
        }

        if (used >= 3) {
          return jsonResponse(
            {
              error: 'Monthly verification limit reached. Upgrade to Premium.',
            },
            403
          )
        }
      }

      if (!code) {
        return jsonResponse({ error: 'Code is required' }, 400)
      }

      const { data: users } = await adminClient
        .from('User')
        .select('*')
        .eq('verification_code', code)

      if (!users || users.length === 0) {
        return jsonResponse({ error: 'Invalid code' }, 404)
      }

      const targetUser = users[0]

      if (targetUser.verification_code_expires) {
        if (new Date(targetUser.verification_code_expires) < new Date()) {
          return jsonResponse({ error: 'Code expired' }, 400)
        }
      }

      const status =
        targetUser.relationship_status === 'date_locked'
          ? 'Date-Locked'
          : 'Date-Picking'

      let partnerInfo = null

      if (targetUser.relationship_status === 'date_locked' && targetUser.couple_profile_id) {
        const { data: profile } = await adminClient
          .from('CoupleProfile')
          .select('*')
          .eq('id', targetUser.couple_profile_id)
          .maybeSingle()

        if (profile) {
          const partnerEmail =
            profile.partner1_email === targetUser.email
              ? profile.partner2_email
              : profile.partner1_email

          const { data: partner } = await adminClient
            .from('User')
            .select('*')
            .eq('email', partnerEmail)
            .maybeSingle()

          if (partner) {
            partnerInfo = {
              full_name: partner.full_name,
              profile_photo: partner.profile_photo,
            }
          }
        }
      }

      if (currentUser.subscription_tier !== 'premium') {
        const newCount = (currentUser.verifications_used_this_month || 0) + 1

        await adminClient
          .from('User')
          .update({
            verifications_used_this_month: newCount,
          })
          .eq('id', currentUser.id)
      }

      if (currentUser.subscription_tier === 'premium') {
        await adminClient.from('VerificationLog').insert({
          user_email: currentUser.email,
          verified_user_email: targetUser.email,
          verified_user_name: targetUser.full_name,
          verification_code: code,
          verification_status: status,
          partner_name: partnerInfo?.full_name || null,
          verification_timestamp: new Date().toISOString(),
        })
      }

      return jsonResponse({
        status,
        user: {
          full_name: targetUser.full_name,
          profile_photo: targetUser.profile_photo,
          location: targetUser.location,
        },
        partner: partnerInfo,
        verifiedAt: new Date().toISOString(),
      })
    }

    return jsonResponse({ error: 'Invalid action' }, 400)
  } catch (error) {
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
