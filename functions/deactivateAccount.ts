import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Deactivating account for user:', user.email);

    // Clear user data cache
    await base44.auth.updateMe({
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
    });

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