import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    // Find the code
    const codes = await base44.asServiceRole.entities.DateLockCode.filter({
      code: code.toString(),
      status: 'active'
    });

    if (codes.length === 0) {
      return Response.json({ error: 'Invalid or expired code' }, { status: 404 });
    }

    const dateLockCode = codes[0];

    // Check if code expired
    if (new Date(dateLockCode.expires_at) < new Date()) {
      await base44.asServiceRole.entities.DateLockCode.update(dateLockCode.id, {
        status: 'expired'
      });
      return Response.json({ error: 'Code has expired' }, { status: 400 });
    }

    // Prevent self-redemption
    if (dateLockCode.creator_email === user.email) {
      return Response.json({ error: 'You cannot redeem your own code' }, { status: 400 });
    }

    // Check if user is already Date-Locked
    if (user.relationship_status === 'date_locked' && user.couple_profile_id) {
      return Response.json({ error: 'You are already Date-Locked with someone' }, { status: 400 });
    }

    // Create couple profile
    const coupleProfile = await base44.asServiceRole.entities.CoupleProfile.create({
      partner1_email: dateLockCode.creator_email,
      partner2_email: user.email,
      date_locked_at: new Date().toISOString()
    });

    // Update code status
    await base44.asServiceRole.entities.DateLockCode.update(dateLockCode.id, {
      status: 'redeemed',
      redeemed_by: user.email,
      redeemed_at: new Date().toISOString()
    });

    // Update creator's profile
    const creatorUsers = await base44.asServiceRole.entities.User.filter({
      email: dateLockCode.creator_email
    });
    
    if (creatorUsers.length > 0) {
      await base44.asServiceRole.entities.User.update(creatorUsers[0].id, {
        relationship_status: 'date_locked',
        partner_email: user.email,
        couple_profile_id: coupleProfile.id
      });
    }

    // Update current user's profile
    await base44.asServiceRole.entities.User.update(user.id, {
      relationship_status: 'date_locked',
      partner_email: dateLockCode.creator_email,
      couple_profile_id: coupleProfile.id
    });

    return Response.json({
      success: true,
      couple_profile_id: coupleProfile.id,
      partner_name: dateLockCode.creator_name,
      message: `You are now Date-Locked with ${dateLockCode.creator_name}!`
    });
  } catch (error) {
    console.error('Redeem Date-Lock code error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});