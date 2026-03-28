import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const appUrl = Deno.env.get('APP_URL') || new URL(req.url).origin
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY')

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return Response.json(
        {
          error:
            'Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY',
        },
        { status: 500 }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return Response.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    // Client for identifying the logged-in user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    // Separate admin client for privileged operations
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized user' }, { status: 401 })
    }

    // Check custom admin flag/role from app_metadata or user_metadata
    const isAdmin =
      user.app_metadata?.role === 'admin' ||
      user.app_metadata?.is_admin === true ||
      user.user_metadata?.role === 'admin'

    if (!isAdmin) {
      return Response.json({ error: 'Unauthorized. Admin only.' }, { status: 403 })
    }

    const urls = {
      app_url: appUrl,
      callback_url: `${appUrl}/Subscription`,
      webhook_url: `${appUrl}/api/functions/paystackWebhook`,
      webhook_secret_preview: paystackSecret
        ? `${paystackSecret.substring(0, 10)}...`
        : null,
      paystack_config: {
        callback_url_note: 'Used during payment initialization',
        webhook_url: `${appUrl}/api/functions/paystackWebhook`,
        webhook_events: [
          'charge.success',
          'subscription.create',
          'subscription.disable',
        ],
        ip_whitelist: 'Not required when using signature verification',
      },
      admin_user: {
        id: user.id,
        email: user.email,
        role: user.app_metadata?.role || user.role || null,
      },
    }

    return Response.json(urls, { status: 200 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
})
