import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has an active code
    const existingCodes = await base44.asServiceRole.entities.DateLockCode.filter({
      creator_email: user.email,
      status: 'active'
    });

    // Expire old active codes
    for (const oldCode of existingCodes) {
      await base44.asServiceRole.entities.DateLockCode.update(oldCode.id, {
        status: 'expired'
      });
    }

    // Generate a unique 6-digit code
    let code;
    let isUnique = false;
    
    while (!isUnique) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Check if code already exists
      const existing = await base44.asServiceRole.entities.DateLockCode.filter({
        code: code,
        status: 'active'
      });
      
      if (existing.length === 0) {
        isUnique = true;
      }
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create the Date-Lock code
    const dateLockCode = await base44.asServiceRole.entities.DateLockCode.create({
      code: code,
      creator_email: user.email,
      creator_name: user.full_name || user.email,
      status: 'active',
      expires_at: expiresAt.toISOString()
    });

    // Update user status to pending verification
    await base44.asServiceRole.entities.User.update(user.id, {
      relationship_status: 'pending_verification'
    });

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