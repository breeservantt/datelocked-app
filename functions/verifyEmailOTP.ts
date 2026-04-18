import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return Response.json({ error: 'Email and OTP are required' }, { status: 400 });
    }

    // Find OTP record
    const otpRecords = await base44.asServiceRole.entities.EmailOTP.filter({ 
      email,
      verified: false
    });

    if (otpRecords.length === 0) {
      return Response.json({ error: 'No pending verification found' }, { status: 404 });
    }

    const otpRecord = otpRecords[0];

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      await base44.asServiceRole.entities.EmailOTP.delete(otpRecord.id);
      return Response.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Check attempt limit
    if (otpRecord.attempts >= 5) {
      await base44.asServiceRole.entities.EmailOTP.delete(otpRecord.id);
      return Response.json({ error: 'Too many failed attempts. Please request a new OTP.' }, { status: 400 });
    }

    // Hash provided OTP
    const encoder = new TextEncoder();
    const data = encoder.encode(otp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const providedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verify OTP
    if (providedHash !== otpRecord.otp_hash) {
      // Increment attempts
      await base44.asServiceRole.entities.EmailOTP.update(otpRecord.id, {
        attempts: otpRecord.attempts + 1
      });
      
      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      return Response.json({ 
        error: `Invalid OTP. ${remainingAttempts} attempts remaining.` 
      }, { status: 400 });
    }

    // OTP is valid - delete the record
    await base44.asServiceRole.entities.EmailOTP.delete(otpRecord.id);

    // Check if we're in beta period
    const BETA_START = new Date('2025-01-10T00:00:00Z');
    const BETA_END = new Date('2025-01-25T23:59:59Z');
    const now = new Date();
    const isBetaPeriod = now >= BETA_START && now <= BETA_END;

    // Return beta status for user creation
    return Response.json({
      success: true,
      verified: true,
      is_beta_period: isBetaPeriod,
      beta_access: isBetaPeriod
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});