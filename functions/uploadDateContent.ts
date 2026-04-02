import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_STRIKES = 3

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
    console.log('=== BACKEND UPLOAD FUNCTION START ===')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !anonKey || !serviceKey || !openaiKey) {
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

    console.log('1. User authenticated:', user.email)

    const payload = await req.json()
    const { content_url, content_type, visibility, caption, location } = payload

    if (!content_url) {
      return jsonResponse({ error: 'content_url is required' }, 400)
    }

    console.log('2. Running moderation...')

    let moderationResult: any = {
      nudity: false,
      sexualExplicit: false,
      minorsDetected: false,
      violence: false,
      harassment: false,
      safe: true,
      reason: '',
    }

    const moderationPrompt = `Analyze content safety:

Caption: "${caption || ''}"
Location: "${location || ''}"

Return JSON:
{
  "nudity": boolean,
  "sexualExplicit": boolean,
  "minorsDetected": boolean,
  "violence": boolean,
  "harassment": boolean,
  "safe": boolean,
  "reason": string
}`

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [{ role: 'user', content: moderationPrompt }],
        response_format: { type: 'json_object' },
      }),
    })

    const aiData = await aiResponse.json()
    moderationResult = JSON.parse(aiData.choices[0].message.content)

    console.log('3. Moderation result:', moderationResult)

    let violation = null
    if (moderationResult.nudity) violation = 'Nudity not allowed'
    if (moderationResult.sexualExplicit) violation = 'Explicit sexual content not allowed'
    if (moderationResult.minorsDetected) violation = 'Minors strictly prohibited'
    if (moderationResult.violence) violation = 'Violent content not allowed'
    if (moderationResult.harassment) violation = 'Harassment or abuse detected'

    if (violation) {
      console.log('4. VIOLATION:', violation)

      const { data: strikes } = await adminClient
        .from('StrikeRecord')
        .select('*')
        .eq('user_email', user.email)
        .eq('is_active', true)

      const strikeNumber = (strikes?.length || 0) + 1

      await adminClient.from('StrikeRecord').insert({
        user_email: user.email,
        reason: violation,
        strike_number: strikeNumber,
        is_active: true,
      })

      if (strikeNumber >= MAX_STRIKES) {
        await adminClient
          .from('User')
          .update({
            account_status: 'suspended',
            suspension_reason: 'Strike limit reached',
          })
          .eq('id', user.id)

        return jsonResponse(
          {
            error: 'ACCOUNT_SUSPENDED',
            message: 'Strike limit reached. Account suspended.',
          },
          403
        )
      }

      return jsonResponse(
        {
          error: 'POLICY_VIOLATION',
          message: violation,
          strikes: strikeNumber,
        },
        400
      )
    }

    console.log('5. Content APPROVED')

    const { data: content, error: insertError } = await adminClient
      .from('DateContent')
      .insert({
        owner_email: user.email,
        content_url,
        content_type: content_type || 'IMAGE',
        visibility: visibility || 'PUBLIC_WALL',
        caption: caption || '',
        location: location || '',
        moderation_status: 'APPROVED',
        moderation_flags: moderationResult,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    console.log('6. Content saved:', content.id)

    return jsonResponse({
      success: true,
      contentId: content.id,
    })
  } catch (error) {
    console.error('UPLOAD ERROR:', error)
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
