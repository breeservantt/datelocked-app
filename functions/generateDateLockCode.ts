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

    // Check if user already has an active code
    const { data: existingCodes, error: existingCodesError } = await supabase
      .from('DateLockCode')
      .select('*')
      .eq('creator_email', user.email)
      .eq('status', 'active');

    if (existingCodesError) {
      throw existingCodesError;
    }

    // Expire old active codes
    for (const oldCode of existingCodes || []) {
      const { error: expireError } = await supabase
        .from('DateLockCode')
        .update({ status: 'expired' })
        .eq('id', oldCode.id);

      if (expireError) {
        throw expireError;
      }
    }

    // Generate a unique 6-digit code
    let code;
    let isUnique = false;

    while (!isUnique) {
      code = Math.floor(100000 + Math.random() * 900000).toString();

      const { data: existing, error: existingError } = await supabase
        .from('DateLockCode')
        .select('*')
        .eq('code', code)
        .eq('status', 'active');

      if (existingError) {
        throw existingError;
      }

      if (!existing || existing.length === 0) {
        isUnique = true;
      }
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create the Date-Lock code
    const { data: dateLockCode, error: createError } = await supabase
      .from('DateLockCode')
      .insert({
        code: code,
        creator_email: user.email,
        creator_name: user.user_metadata?.full_name || user.email,
        status: 'active',
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Update user status to pending verification
    const { error: updateUserError } = await supabase
      .from('User')
      .update({
        relationship_status: 'pending_verification'
      })
      .eq('id', user.id);

    if (updateUserError) {
      throw updateUserError;
    }

    return Response.json({
      success: true,
      code: code,
      expires_at: expiresAt.toISOString(),
      code_id: dateLockCode.id
    });

  } catch (error) {
    console.error('Generate Date-Lock code error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});
