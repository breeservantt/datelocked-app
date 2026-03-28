import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { loginWithOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage('Please enter your email address.');
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await loginWithOtp(email.trim());

    if (!result.success) {
      setMessage(result.error?.message || 'Login failed.');
      setLoading(false);
      return;
    }

    setMessage('Check your email for the login link or OTP.');
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f8fafc' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>Login</h1>
        <p style={{ margin: '0 0 20px 0', color: '#475569' }}>
          Enter your email address to receive a secure login link.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              marginBottom: '12px',
              boxSizing: 'border-box'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: 'none',
              borderRadius: '10px',
              background: '#0f172a',
              color: '#ffffff',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Sending...' : 'Send Login Link'}
          </button>
        </form>

        {message ? (
          <p style={{ marginTop: '14px', color: '#334155' }}>{message}</p>
        ) : null}
      </div>
    </div>
  );
}
