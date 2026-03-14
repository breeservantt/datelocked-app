import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Invite user to app first (required before sending emails)
    try {
      await base44.asServiceRole.users.inviteUser(email, 'user');
      console.log('User invited successfully');
    } catch (inviteError) {
      // User might already exist, that's fine - continue
      console.log('User already exists or invite completed:', inviteError.message);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otp_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Set expiration to 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing OTP for this email
    const existingOTPs = await base44.asServiceRole.entities.EmailOTP.filter({ email });
    for (const existing of existingOTPs) {
      await base44.asServiceRole.entities.EmailOTP.delete(existing.id);
    }

    // Create new OTP record
    await base44.asServiceRole.entities.EmailOTP.create({
      email,
      otp_hash,
      attempts: 0,
      expires_at: expiresAt.toISOString(),
      verified: false
    });

    // Send OTP via email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: '🔐 Your Date-Locked Verification Code',
      body: `Welcome to Date-Locked!

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

The Date-Locked Team`
    });

    return Response.json({
      success: true,
      message: 'OTP sent to email',
      expires_at: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Generate OTP error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});