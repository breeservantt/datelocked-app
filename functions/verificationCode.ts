import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, code } = await req.json();

    // Check subscription for validation
    if (action === 'validate') {
      const isPremium = user.subscription_tier === 'premium' && 
        user.subscription_expires && 
        new Date(user.subscription_expires) > new Date();

      if (!isPremium) {
        // Check free tier limits
        const today = new Date().toISOString().split('T')[0];
        const resetDate = user.verifications_reset_date;
        
        let verificationsUsed = user.verifications_used_this_month || 0;
        
        // Reset counter if new month
        if (!resetDate || resetDate !== today.substring(0, 7)) {
          verificationsUsed = 0;
          await base44.auth.updateMe({
            verifications_used_this_month: 0,
            verifications_reset_date: today.substring(0, 7)
          });
        }
        
        if (verificationsUsed >= 3) {
          return Response.json({ 
            error: 'Monthly verification limit reached. Upgrade to Premium for unlimited verifications.' 
          }, { status: 403 });
        }
      }
    }

    if (action === 'generate') {
      // Generate a 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store in user profile temporarily
      await base44.auth.updateMe({
        verification_code: verificationCode,
        verification_code_expires: expiresAt.toISOString()
      });

      return Response.json({ code: verificationCode, expiresAt: expiresAt.toISOString() });
    }

    if (action === 'validate') {
      if (!code) {
        return Response.json({ error: 'Code is required' }, { status: 400 });
      }

      // Find user with this verification code
      const users = await base44.asServiceRole.entities.User.filter({
        verification_code: code
      });

      if (users.length === 0) {
        return Response.json({ error: 'Invalid code' }, { status: 404 });
      }

      const targetUser = users[0];

      // Check if code expired
      if (targetUser.verification_code_expires) {
        const expiresAt = new Date(targetUser.verification_code_expires);
        if (expiresAt < new Date()) {
          return Response.json({ error: 'Code expired' }, { status: 400 });
        }
      }

      // Return status
      const status = targetUser.relationship_status === 'date_locked' ? 'Date-Locked' : 'Date-Picking';
      
      let partnerInfo = null;
      if (targetUser.relationship_status === 'date_locked' && targetUser.couple_profile_id) {
        const profiles = await base44.asServiceRole.entities.CoupleProfile.filter({
          id: targetUser.couple_profile_id
        });
        
        if (profiles.length > 0) {
          const profile = profiles[0];
          const partnerEmail = profile.partner1_email === targetUser.email 
            ? profile.partner2_email 
            : profile.partner1_email;
          
          const partners = await base44.asServiceRole.entities.User.filter({ 
            email: partnerEmail 
          });
          
          if (partners.length > 0) {
            partnerInfo = {
              full_name: partners[0].full_name,
              profile_photo: partners[0].profile_photo
            };
          }
        }
      }

      // Update verification count for free tier
      if (user.subscription_tier !== 'premium') {
        const verificationsUsed = (user.verifications_used_this_month || 0) + 1;
        await base44.auth.updateMe({
          verifications_used_this_month: verificationsUsed
        });
      }

      // Log verification for premium users
      if (user.subscription_tier === 'premium') {
        await base44.asServiceRole.entities.VerificationLog.create({
          user_email: user.email,
          verified_user_email: targetUser.email,
          verified_user_name: targetUser.full_name,
          verification_code: code,
          verification_status: status,
          partner_name: partnerInfo?.full_name || null,
          verification_timestamp: new Date().toISOString()
        });
      }

      return Response.json({
        status,
        user: {
          full_name: targetUser.full_name,
          profile_photo: targetUser.profile_photo,
          location: targetUser.location
        },
        partner: partnerInfo,
        verifiedAt: new Date().toISOString()
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});