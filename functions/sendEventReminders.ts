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
      .eq('is_event', true)
      .eq('invitation_status', 'accepted')
      .eq('reminder_sent', false)

    if (eventsError) {
      throw eventsError
    }

    const upcomingEvents =
      events?.filter((event) => {
        const eventTime = new Date(event.event_datetime)
        return eventTime >= now && eventTime <= oneHourFromNow
      }) || []

    let remindersSent = 0

    for (const event of upcomingEvents) {
      try {
        const { data: profiles, error: profileError } = await adminClient
          .from('CoupleProfile')
          .select('*')
          .eq('id', event.couple_profile_id)
          .limit(1)

        if (profileError || !profiles || profiles.length === 0) {
          continue
        }

        const profile = profiles[0]

        const { data: partner1Users, error: partner1Error } = await adminClient
          .from('User')
          .select('*')
          .eq('email', profile.partner1_email)
          .limit(1)

        const { data: partner2Users, error: partner2Error } = await adminClient
          .from('User')
          .select('*')
          .eq('email', profile.partner2_email)
          .limit(1)

        if (
          partner1Error ||
          partner2Error ||
          !partner1Users ||
          !partner2Users ||
          partner1Users.length === 0 ||
          partner2Users.length === 0
        ) {
          continue
        }

        const partner1 = partner1Users[0]
        const partner2 = partner2Users[0]

        const eventTime = new Date(event.event_datetime)
        const timeString = eventTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })

        const message = `🔔 Reminder: Your event "${event.title}" is starting in 1 hour at ${timeString}! ${event.event_location ? `Location: ${event.event_location}` : ''}

Open Date-Locked: ${appUrl}`

        await sendEmail(resendApiKey, partner1.email, `Event Reminder: ${event.title}`, message)
        await sendEmail(resendApiKey, partner2.email, `Event Reminder: ${event.title}`, message)

        const { error: updateError } = await adminClient
          .from('CoupleGoal')
          .update({
            reminder_sent: true,
          })
          .eq('id', event.id)

        if (updateError) {
          throw updateError
        }

        remindersSent++
      } catch (error) {
        console.error(`Failed to send reminder for event ${event.id}:`, error)
      }
    }

    return jsonResponse({
      success: true,
      remindersSent,
      eventsChecked: upcomingEvents.length,
    })
  } catch (error) {
    console.error('Event reminder error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      500
    )
  }
})

async function sendEmail(
  resendApiKey: string,
  to: string,
  subject: string,
  text: string
) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Date-Locked <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to send email to ${to}: ${errorText}`)
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  })
}
