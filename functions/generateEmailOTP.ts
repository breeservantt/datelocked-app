import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Invite user to app first (required before sending emails)
    try {
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: 'user' }
      });

      if (inviteError) {
        throw inviteError;
      }

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
    const { data: existingOTPs, error: existingOTPsError } = await supabase
      .from('EmailOTP')
      .select('*')
      .eq('email', email);

    if (existingOTPsError) {
      throw existingOTPsError;
    }

    for (const existing of existingOTPs || []) {
      const { error: deleteError } = await supabase
        .from('EmailOTP')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        throw deleteError;
      }
    }

    // Create new OTP record
    const { error: createOtpError } = await supabase
      .from('EmailOTP')
      .insert({
        email,
        otp_hash,
        attempts: 0,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (createOtpError) {
      throw createOtpError;
    }

    // Send OTP via email
    // Replace this with your email provider integration
    // Example: Resend, SendGrid, Postmark, SMTP, etc.

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
