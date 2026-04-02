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

    const authHeader = req.headers.get('Authorization')

    const userClient = createClient(supabaseUrl!, anonKey!, {
      global: { headers: { Authorization: authHeader! } },
    })

    const adminClient = createClient(supabaseUrl!, serviceKey!)

    const {
      data: { user },
    } = await userClient.auth.getUser()

    const { data: currentUser } = await adminClient
      .from('User')
      .select('*')
      .eq('id', user?.id)
      .single()

    if (currentUser?.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden: Admin access required' }, 403)
    }

    const timestamp = new Date().toISOString()
    const issues: string[] = []
    const warnings: string[] = []
    const info: string[] = []

    // --- Payment Check --- //
    try {
      const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')

      if (!paystackSecret) {
        issues.push('Payment configuration: Missing Paystack key')
      } else {
        const response = await fetch('https://api.paystack.co/transaction', {
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
          },
        })

        if (!response.ok) {
          issues.push(`Payment configuration failed: ${response.status}`)
        } else {
          info.push('Payment configuration: OK')
        }
      }
    } catch (e) {
      issues.push('Payment check failed')
    }

    // --- Suspicious Activity --- //
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const { data: logs } = await adminClient
      .from('VerificationLog')
      .select('*')
      .order('verification_timestamp', { ascending: false })
      .limit(100)

    const recentFails =
      logs?.filter(
        (l) =>
          new Date(l.verification_timestamp) > last24h &&
          l.verification_status === 'failed'
      ) || []

    if (recentFails.length > 50) {
      warnings.push(`High failed verifications: ${recentFails.length}`)
    }

    const { data: users } = await adminClient.from('User').select('*')

    const newUsers =
      users?.filter((u) => new Date(u.created_date) > last24h) || []

    if (newUsers.length > 100) {
      warnings.push(`High new accounts: ${newUsers.length}`)
    }

    const suspiciousUsers =
      users?.filter((u) => (u.verifications_used_this_month || 0) > 50) || []

    if (suspiciousUsers.length > 0) {
      warnings.push(`${suspiciousUsers.length} users excessive verification`)
    }

    // --- Data Integrity --- //
    const { data: couples } = await adminClient
      .from('CoupleProfile')
      .select('*')

    const userEmails = new Set(users?.map((u) => u.email))

    const orphaned =
      couples?.filter(
        (c) =>
          !userEmails.has(c.partner1_email) ||
          !userEmails.has(c.partner2_email)
      ) || []

    if (orphaned.length > 0) {
      warnings.push(`${orphaned.length} orphaned couple profiles`)
    }

    const invalidUsers =
      users?.filter(
        (u) =>
          u.relationship_status === 'date_locked' &&
          !u.couple_profile_id
      ) || []

    if (invalidUsers.length > 0) {
      warnings.push(`${invalidUsers.length} invalid relationship states`)
    }

    const { data: invites } = await adminClient
      .from('RelationshipInvitation')
      .select('*')
      .eq('status', 'pending')

    const expiredInvites =
      invites?.filter((i) => new Date(i.expires_at) < new Date()) || []

    if (expiredInvites.length > 10) {
      warnings.push(`${expiredInvites.length} expired invites`)
    }

    // --- System Health --- //
    const { count: userCount } = await adminClient
      .from('User')
      .select('*', { count: 'exact', head: true })

    const { count: memoryCount } = await adminClient
      .from('Memory')
      .select('*', { count: 'exact', head: true })

    const { count: goalCount } = await adminClient
      .from('CoupleGoal')
      .select('*', { count: 'exact', head: true })

    info.push(
      `Users: ${userCount}, Memories: ${memoryCount}, Goals: ${goalCount}`
    )

    const status =
      issues.length > 0
        ? 'CRITICAL'
        : warnings.length > 0
        ? 'WARNING'
        : 'HEALTHY'

    const report = {
      timestamp,
      status,
      issues,
      warnings,
      info,
      summary: {
        critical_issues: issues.length,
        warnings: warnings.length,
        info_items: info.length,
      },
    }

    return jsonResponse(report)
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'ERROR',
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
