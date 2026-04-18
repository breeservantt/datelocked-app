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

    if (userError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blockedEmail } = await req.json();

    if (blockedEmail === user.email) {
      return Response.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    // Check if already blocked
    const { data: existing, error: existingError } = await supabase
      .from('BlockRelation')
      .select('*')
      .eq('blocker_email', user.email)
      .eq('blocked_email', blockedEmail);

    if (existingError) {
      throw existingError;
    }

    if (existing && existing.length > 0) {
      return Response.json({ error: 'User already blocked' }, { status: 400 });
    }

    const { error: createError } = await supabase
      .from('BlockRelation')
      .insert({
        blocker_email: user.email,
        blocked_email: blockedEmail,
      });

    if (createError) {
      throw createError;
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Block error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
