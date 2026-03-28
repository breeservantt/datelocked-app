import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') || '',
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
    }

    const origin = new URL(req.url).origin;

    const urls = {
      app_url: origin,
      callback_url: `${origin}/Subscription`,
      webhook_url: `${origin}/api/functions/paystackWebhook`,
      webhook_secret: Deno.env.get('PAYSTACK_SECRET_KEY')?.substring(0, 10) + '...',
      paystack_config: {
        callback_url_note: 'This is automatically used in payment initialization',
        webhook_url: `${origin}/api/functions/paystackWebhook`,
        webhook_events: ['charge.success', 'subscription.create', 'subscription.disable'],
        ip_whitelist: 'Not required (uses signature verification)'
      }
    };

    return Response.json(urls);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
