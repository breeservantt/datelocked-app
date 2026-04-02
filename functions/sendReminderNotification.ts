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
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const appUrl = Deno.env.get('APP_URL') || 'https://your-domain.com'

    if (!supabaseUrl || !anonKey || !serviceKey || !resendApiKey) {
      return jsonResponse({ error: 'Missing environment variables' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized' }, 403)
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
      data: { user },
      error: authError,
    } = await userClient.auth.getUser()

    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 403)
    }

    const { data: adminUser, error: adminUserError } = await adminClient
      .from('User')
      .select('*')
      .eq('id', user.id)
      .single()

    if (adminUserError || !adminUser || adminUser.role !== 'admin') {
      return jsonResponse({ error: 'Unauthorized' }, 403)
    }

    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

    const { data: events, error: eventsError } = await adminClient
      .from('CoupleGoal')
      .select('*')

    if (eventsError) {
      throw eventsError
    }

    const upcomingEvents =
      events?.filter((event) => {
        if (!event.is_event || event.invitation_status !== 'accepted') return false
        const eventTime = new Date(event.event_datetime)
        return eventTime >= now && eventTime <= oneHourFromNow && !event.reminder_sent
      }) || []

    let sentCount = 0

    for (const event of upcomingEvents) {
      const { data: couples, error: couplesError } = await adminClient
        .from('CoupleProfile')
        .select('*')
        .eq('id', event.couple_profile_id)
        .limit(1)

      if (couplesError || !couples || couples.length === 0) {
        continue
      }

      const couple = couples[0]
      const emails = [couple.partner1_email, couple.partner2_email].filter(Boolean)

      for (const email of emails) {
        const emailBody = `This is a reminder that your event "${event.title}" is starting in 1 hour.

Date & Time: ${new Date(event.event_datetime).toLocaleString()}
Location: ${event.event_location || 'No location specified'}

Log in to Date-Locked to view details: ${appUrl}`

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Date-Locked <onboarding@resend.dev>',
            to: [email],
            subject: `⏰ Reminder: ${event.title} in 1 hour`,
            text: emailBody,
          }),
        })

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text()
          throw new Error(`Failed to send reminder email to ${email}: ${errorText}`)
        }

        sentCount++
      }

      const { error: updateError } = await adminClient
        .from('CoupleGoal')
        .update({
          reminder_sent: true,
        })
        .eq('id', event.id)

      if (updateError) {
        throw updateError
      }
    }

    return jsonResponse({
      success: true,
      sentCount,
      message: `Sent ${sentCount} reminder notifications`,
    })
  } catch (error) {
    console.error('Error sending reminders:', error)
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
