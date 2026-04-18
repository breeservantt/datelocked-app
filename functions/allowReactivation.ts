import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('Checking reactivation eligibility for:', email);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    );

    const { data: users, error: fetchError } = await supabase
      .from('User')
      .select('*')
      .eq('email', email);

    if (fetchError) {
      throw fetchError;
    }

    if (!users || users.length === 0) {
      console.log('No user found with email:', email);
      return Response.json({
        allowed: true,
        reason: 'new_user',
        message: 'Email is available for registration'
      });
    }

    const user = users[0];

    if (user.account_status === 'deactivated') {
      console.log('Found deactivated account for:', email);

      const { error: updateError } = await supabase
        .from('User')
        .update({
          account_status: 'active',
          deactivated_at: null,
          onboarding_completed: false,
          relationship_status: 'single',
          couple_profile_id: '',
          partner_email: '',
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

      console.log('Account reset and ready for re-registration:', email);

      return Response.json({
        allowed: true,
        reason: 'reactivated',
        message: 'Deactivated account has been reset. You can now re-register.'
      });
    }

    console.log('User exists and is active:', email);
    return Response.json({
      allowed: false,
      reason: 'active_user',
      message: 'This email is already registered with an active account'
    }, { status: 409 });

  } catch (error) {
    console.error('Reactivation check error:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});
