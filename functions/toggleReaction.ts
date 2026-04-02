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

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ error: 'Missing environment variables' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
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
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const body = await req.json().catch(() => null)
    const contentId = body?.contentId
    const reactionType = body?.reactionType

    if (!contentId) {
      return jsonResponse({ error: 'contentId is required' }, 400)
    }

    if (reactionType !== 'heart') {
      return jsonResponse({ error: 'Invalid reaction type' }, 400)
    }

    const { data: existing, error: existingError } = await adminClient
      .from('ContentReaction')
      .select('*')
      .eq('content_id', contentId)
      .eq('user_email', user.email)

    if (existingError) {
      throw existingError
    }

    if (existing && existing.length > 0) {
      const existingReaction = existing[0]

      if (existingReaction.reaction_type === reactionType) {
        const { error: deleteError } = await adminClient
          .from('ContentReaction')
          .delete()
          .eq('id', existingReaction.id)

        if (deleteError) {
          throw deleteError
        }

        return jsonResponse({ success: true, action: 'removed' })
      }

      const { error: updateError } = await adminClient
        .from('ContentReaction')
        .update({
          reaction_type: reactionType,
        })
        .eq('id', existingReaction.id)

      if (updateError) {
        throw updateError
      }

      return jsonResponse({ success: true, action: 'updated' })
    }

    const { error: insertError } = await adminClient
      .from('ContentReaction')
      .insert({
        content_id: contentId,
        user_email: user.email,
        reaction_type: reactionType,
      })

    if (insertError) {
      throw insertError
    }

    return jsonResponse({ success: true, action: 'added' })
  } catch (error) {
    console.error('Reaction error:', error)
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
