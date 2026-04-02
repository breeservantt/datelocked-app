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
    console.log('Starting system health check...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!supabaseUrl || !anonKey || !serviceKey || !resendApiKey) {
      return jsonResponse({ error: 'Missing environment variables' }, 500)
    }

    const authHeader = req.headers.get('Authorization')

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || '' } },
    })

    const adminClient = createClient(supabaseUrl, serviceKey)

    const {
      data: { user },
    } = await userClient.auth.getUser()

    const { data: currentUser } = await adminClient
      .from('User')
      .select('*')
      .eq('id', user?.id)
      .single()

    if (!currentUser || currentUser.role !== 'admin') {
      return jsonResponse({ error: 'Unauthorized' }, 403)
    }

    const issues: any[] = []
    const timestamp = new Date().toISOString()

    // --- ENV CHECK ---
    const requiredSecrets = [
      'PAYFAST_MERCHANT_ID',
      'PAYFAST_MERCHANT_KEY',
      'PAYFAST_PASSPHRASE',
    ]

    const missingSecrets = requiredSecrets.filter((s) => !Deno.env.get(s))

    if (missingSecrets.length > 0) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Configuration',
        message: `Missing required secrets: ${missingSecrets.join(', ')}`,
      })
    }

    // --- DB CHECK ---
    try {
      const { error } = await adminClient.from('User').select('id').limit(1)
      if (error) throw error
    } catch (error) {
      issues.push({
        severity: 'CRITICAL',
        category: 'Database',
        message: `Database connection failed`,
      })
    }

    // --- PAYMENT CHECK ---
    try {
      const payfastMerchantId = Deno.env.get('PAYFAST_MERCHANT_ID')
      const payfastMerchantKey = Deno.env.get('PAYFAST_MERCHANT_KEY')
      const payfastPassphrase = Deno.env.get('PAYFAST_PASSPHRASE')
      const isSandbox = Deno.env.get('PAYFAST_SANDBOX') === 'true'

      if (!payfastMerchantId || !payfastMerchantKey || !payfastPassphrase) {
        issues.push({
          severity: 'CRITICAL',
          category: 'Payment Gateway',
          message: 'PayFast credentials incomplete',
        })
      } else {
        if (isSandbox && !payfastMerchantId.startsWith('10')) {
          issues.push({
            severity: 'HIGH',
            category: 'Payment Gateway',
            message: 'Sandbox mismatch merchant ID',
          })
        }

        const { data: premiumUsers } = await adminClient
          .from('User')
          .select('*')
          .eq('subscription_tier', 'premium')

        if (!premiumUsers || premiumUsers.length === 0) {
          issues.push({
            severity: 'MEDIUM',
            category: 'Payment Gateway',
            message: 'No premium users detected',
          })
        }
      }
    } catch (error) {
      issues.push({
        severity: 'HIGH',
        category: 'Payment Gateway',
        message: 'Payment diagnostics failed',
      })
    }

    // --- DATA INTEGRITY ---
    try {
      const { data: users } = await adminClient
        .from('User')
        .select('*')
        .eq('relationship_status', 'date_locked')

      for (const user of users || []) {
        if (user.couple_profile_id) {
          const { data: couple } = await adminClient
            .from('CoupleProfile')
            .select('*')
            .eq('id', user.couple_profile_id)
            .maybeSingle()

          if (!couple) {
            issues.push({
              severity: 'MEDIUM',
              category: 'Data Integrity',
              message: `Invalid couple profile for ${user.email}`,
            })
          }
        }
      }

      const { data: invites } = await adminClient
        .from('RelationshipInvitation')
        .select('*')
        .eq('status', 'pending')

      const now = new Date()

      const expired = (invites || []).filter(
        (i) => new Date(i.expires_at) < now
      )

      if (expired.length > 10) {
        issues.push({
          severity: 'LOW',
          category: 'Cleanup',
          message: `${expired.length} expired invitations`,
        })
      }
    } catch (error) {
      issues.push({
        severity: 'MEDIUM',
        category: 'Data Integrity',
        message: 'Integrity check failed',
      })
    }

    // --- STATUS ---
    const status =
      issues.find((i) => i.severity === 'CRITICAL')
        ? 'CRITICAL'
        : issues.find((i) => i.severity === 'HIGH')
        ? 'DEGRADED'
        : 'HEALTHY'

    // --- ALERT ADMINS ---
    if (issues.length > 0) {
      const { data: admins } = await adminClient
        .from('User')
        .select('*')
        .eq('role', 'admin')

      const emailBody = `
System Health Report

Status: ${status}
Time: ${new Date(timestamp).toLocaleString()}

Issues:
${issues.map((i) => `[${i.severity}] ${i.category} - ${i.message}`).join('\n')}
`

      for (const admin of admins || []) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Date-Locked Monitor <onboarding@resend.dev>',
            to: [admin.email],
            subject: `System Health: ${status}`,
            text: emailBody,
          }),
        })
      }
    }

    return jsonResponse({
      success: true,
      timestamp,
      status,
      issues_count: issues.length,
      issues,
    })
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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
