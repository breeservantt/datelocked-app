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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const appUrl = Deno.env.get('APP_URL') || 'https://your-domain.com'

    if (!supabaseUrl || !serviceKey || !resendApiKey) {
      return jsonResponse({ error: 'Missing environment variables' }, 500)
    }

    const adminClient = createClient(supabaseUrl, serviceKey)

    const body = await req.json()
    const recipientEmail = body?.recipientEmail?.toString().trim()
    const senderName = body?.senderName?.toString().trim()
    const message = body?.message?.toString().trim() || ''

    if (!recipientEmail || !senderName) {
      return jsonResponse({ error: 'Missing required fields' }, 400)
    }

    const preview =
      message.length > 100 ? `${message.substring(0, 100)}...` : message

    const emailBody = `You have a new message from ${senderName} on Date-Locked.

${preview ? `"${preview}"` : ''}

Log in to view and reply: ${appUrl}`

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Date-Locked <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: `💬 New message from ${senderName}`,
        text: emailBody,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      throw new Error(`Failed to send email: ${errorText}`)
    }

    await adminClient.from('NotificationLog').insert({
      type: 'chat_email',
      recipient_email: recipientEmail,
      sender_name: senderName,
      message_preview: preview,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return jsonResponse({ success: true })
  } catch (error) {
    console.error('Error sending chat notification:', error)
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
