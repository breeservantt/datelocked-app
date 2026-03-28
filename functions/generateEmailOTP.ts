// src/pages/EmailOtpAuth.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function EmailOtpAuth() {
  const [step, setStep] = useState('email'); // email | otp | success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sessionUser, setSessionUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        setError(error.message);
        return;
      }

      if (data?.session?.user) {
        setSessionUser(data.session.user);
        setStep('success');
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        setStep('success');
      } else {
        setSessionUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error('Please enter your email address.');
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setMessage('Verification code sent to your email.');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();

      if (!cleanOtp) {
        throw new Error('Please enter the OTP code.');
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: 'email',
      });

      if (error) throw error;

      if (!data?.user) {
        throw new Error('Verification failed. Please try again.');
      }

      setSessionUser(data.user);
      setMessage('Email verified successfully. You are now signed in.');
      setStep('success');
    } catch (err) {
      setError(err.message || 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setMessage('A new verification code has been sent.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setEmail('');
      setOtp('');
      setSessionUser(null);
      setStep('email');
      setMessage('Signed out successfully.');
    } catch (err) {
      setError(err.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Date-Locked Email Verification</h1>
        <p style={styles.subtitle}>
          Sign up or log in with your email verification code.
        </p>

        {message ? <div style={styles.successBox}>{message}</div> : null}
        {error ? <div style={styles.errorBox}>{error}</div> : null}

        {step === 'email' && (
          <form onSubmit={handleSendOtp} style={styles.form}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoComplete="email"
            />

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending...' : 'Send verification code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              disabled
              style={{ ...styles.input, backgroundColor: '#f4f4f4' }}
            />

            <label style={styles.label}>Enter OTP code</label>
            <input
              type="text"
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={styles.input}
              inputMode="numeric"
              maxLength={6}
            />

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Verifying...' : 'Verify code'}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleResendOtp}
              style={styles.secondaryButton}
            >
              {loading ? 'Please wait...' : 'Resend code'}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setOtp('');
                setError('');
                setMessage('');
                setStep('email');
              }}
              style={styles.linkButton}
            >
              Change email
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={styles.form}>
            <div style={styles.successBox}>
              You are authenticated successfully.
            </div>

            <div style={styles.userBox}>
              <strong>User ID:</strong>
              <div style={styles.userValue}>{sessionUser?.id || '-'}</div>
            </div>

            <div style={styles.userBox}>
              <strong>Email:</strong>
              <div style={styles.userValue}>{sessionUser?.email || '-'}</div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleSignOut}
              style={styles.button}
            >
              {loading ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f7f7fb',
    padding: '24px',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    background: '#ffffff',
    borderRadius: '18px',
    padding: '28px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },
  title: {
    margin: 0,
    marginBottom: '8px',
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    marginTop: '8px',
    padding: '12px 14px',
    borderRadius: '12px',
    border: 'none',
    background: '#111827',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#111827',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  linkButton: {
    marginTop: '2px',
    background: 'transparent',
    border: 'none',
    color: '#2563eb',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    padding: 0,
  },
  successBox: {
    background: '#ecfdf5',
    color: '#065f46',
    border: '1px solid #a7f3d0',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '14px',
    fontSize: '14px',
  },
  errorBox: {
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '14px',
    fontSize: '14px',
  },
  userBox: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '10px',
  },
  userValue: {
    marginTop: '4px',
    color: '#374151',
    wordBreak: 'break-word',
  },
};
