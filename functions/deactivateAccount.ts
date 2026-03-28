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

    console.log('Deactivating account for user:', user.email);

    const { error: updateError } = await supabase
      .from('User')
      .update({
        account_status: 'deactivated',
        deactivated_at: new Date().toISOString(),
        couple_profile_id: '',
        partner_email: '',
        relationship_status: 'single',
        profile_photo: '',
        location: '',
        biometric_enrolled: false,
        biometric_device_hash: '',
        insights_consent: false,
        subscription_tier: 'free',
        subscription_expires: null
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    console.log('Account deactivated and cache cleared:', user.email);

    return Response.json({
      success: true,
      message: 'Account deactivated successfully. All data cleared.'
    });

  } catch (error) {
    console.error('Account deactivation error:', error);
    return Response.json({
      error: error.message || 'Failed to deactivate account'
    }, { status: 500 });
  }
});
