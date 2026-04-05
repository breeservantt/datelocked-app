import React from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Lock, Copy, Check, RefreshCw,
  Heart, Loader2, Clock, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function InvitePartner() {
  const navigate = useNavigate();

  const [user, setUser] = React.useState(null);
  const [dateLockCode, setDateLockCode] = React.useState(null);
  const [redeemCode, setRedeemCode] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isRedeeming, setIsRedeeming] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  // ✅ LOAD USER
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      setUser(currentUser);

      if (currentUser?.user_metadata?.relationship_status === 'date_locked') {
        navigate('/');
        return;
      }

      // check existing code
      const { data: codes } = await supabase
        .from('DateLockCode')
        .select('*')
        .eq('creator_id', currentUser.id)
        .eq('status', 'active');

      if (codes?.length > 0) {
        setDateLockCode(codes[0]);
      }
    })();
  }, [navigate]);

  // ✅ GENERATE CODE
  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/functions/generateDateLockCode', {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        setDateLockCode(data);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to generate code');
    }

    setIsGenerating(false);
  };

  // ✅ COPY
  const handleCopyCode = () => {
    navigator.clipboard.writeText(dateLockCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ✅ REDEEM
  const handleRedeemCode = async (e) => {
    e.preventDefault();

    setIsRedeeming(true);
    setError('');

    try {
      const response = await fetch('/api/functions/redeemDateLockCode', {
        method: 'POST',
        body: JSON.stringify({ code: redeemCode })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Invalid code');
    }

    setIsRedeeming(false);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">

      {/* SUCCESS */}
      {success && (
        <Card className="p-4 mb-4 text-center bg-green-50">
          <Check className="mx-auto mb-2 text-green-500" />
          <p>Date-Locked successfully 🎉</p>
        </Card>
      )}

      {/* GENERATE */}
      <Card className="p-4 mb-4">
        {!dateLockCode ? (
          <Button onClick={handleGenerateCode} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate Code'}
          </Button>
        ) : (
          <div className="text-center">
            <h2 className="text-3xl font-bold">{dateLockCode.code}</h2>
            <p className="text-sm">
              Expires {format(new Date(dateLockCode.expires_at), 'MMM d')}
            </p>

            <div className="flex gap-2 mt-3">
              <Button onClick={handleCopyCode}>
                {copied ? <Check /> : <Copy />}
              </Button>

              <Button onClick={handleGenerateCode}>
                <RefreshCw />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* REDEEM */}
      <Card className="p-4">
        <form onSubmit={handleRedeemCode}>
          <Input
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value)}
            placeholder="Enter code"
          />

          {error && (
            <div className="text-red-500 text-sm mt-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={redeemCode.length !== 6 || isRedeeming}
            className="w-full mt-3"
          >
            {isRedeeming ? <Loader2 className="animate-spin" /> : 'Connect'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
