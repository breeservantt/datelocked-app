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
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceKey) {
      return jsonResponse({ error: 'Missing environment variables' }, 500)
    }

    const adminClient = createClient(supabaseUrl, serviceKey)

    const body = await req.json().catch(() => null)
    const email = body?.email?.toString().trim().toLowerCase()
    const otp = body?.otp?.toString().trim()

    if (!email || !otp) {
      return jsonResponse({ error: 'Email and OTP are required' }, 400)
    }

    const { data: otpRecords, error: otpError } = await adminClient
      .from('EmailOTP')
      .select('*')
      .eq('email', email)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (otpError) {
      throw otpError
    }

    if (!otpRecords || otpRecords.length === 0) {
      return jsonResponse({ error: 'No pending verification found' }, 404)
    }

    const otpRecord = otpRecords[0]

    if (new Date(otpRecord.expires_at) < new Date()) {
      await adminClient.from('EmailOTP').delete().eq('id', otpRecord.id)
      return jsonResponse(
        { error: 'OTP has expired. Please request a new one.' },
        400
      )
    }

    if ((otpRecord.attempts || 0) >= 5) {
      await adminClient.from('EmailOTP').delete().eq('id', otpRecord.id)
      return jsonResponse(
        { error: 'Too many failed attempts. Please request a new OTP.' },
        400
      )
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(otp)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const providedHash = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    if (providedHash !== otpRecord.otp_hash) {
      const newAttempts = (otpRecord.attempts || 0) + 1

      await adminClient
        .from('EmailOTP')
        .update({
          attempts: newAttempts,
        })
        .eq('id', otpRecord.id)

      const remainingAttempts = Math.max(0, 5 - newAttempts)

      return jsonResponse(
        {
          error: `Invalid OTP. ${remainingAttempts} attempts remaining.`,
        },
        400
      )
    }

    await adminClient.from('EmailOTP').delete().eq('id', otpRecord.id)

    const BETA_START = new Date('2025-01-10T00:00:00Z')
    const BETA_END = new Date('2025-01-25T23:59:59Z')
    const now = new Date()
    const isBetaPeriod = now >= BETA_START && now <= BETA_END

    return jsonResponse({
      success: true,
      verified: true,
      is_beta_period: isBetaPeriod,
      beta_access: isBetaPeriod,
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
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
