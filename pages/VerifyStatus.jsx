import React from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Key,
  RefreshCw,
  User,
  MapPin,
  CheckCircle,
  Shield,
  Loader2,
  Copy,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function VerifyStatus() {
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [myCode, setMyCode] = React.useState(null);
  const [codeExpiry, setCodeExpiry] = React.useState(null);
  const [inputCode, setInputCode] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [view, setView] = React.useState('my-code');
  const [verificationHistory, setVerificationHistory] = React.useState([]);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;
    setUser(currentUser);

    if (currentUser) {
      const { data: history } = await supabase
        .from('VerificationLog')
        .select('*')
        .eq('user_email', currentUser.email)
        .order('verification_timestamp', { ascending: false })
        .limit(50);

      setVerificationHistory(history || []);
    }

    setIsLoading(false);
  };

  // ✅ GENERATE CODE (CALL YOUR FUNCTION)
  const generateCode = async () => {
    setIsGenerating(true);

    const res = await fetch('/api/functions/verificationCode', {
      method: 'POST',
      body: JSON.stringify({ action: 'generate' })
    });

    const data = await res.json();

    setMyCode(data.code);
    setCodeExpiry(new Date(data.expiresAt));

    setIsGenerating(false);
  };

  // ✅ VALIDATE CODE
  const validateCode = async () => {
    if (!inputCode || inputCode.length !== 6) {
      setError('Enter 6-digit code');
      return;
    }

    setIsValidating(true);
    setError('');

    const res = await fetch('/api/functions/verificationCode', {
      method: 'POST',
      body: JSON.stringify({
        action: 'validate',
        code: inputCode
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Invalid code');
      setIsValidating(false);
      return;
    }

    setVerificationResult(data);
    await loadData();

    setIsValidating(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 pb-24">

      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Date Status</h1>
      </div>

      <AnimatePresence mode="wait">
        {!verificationResult ? (

          <motion.div key="verify">

            {/* TOGGLE */}
            <div className="flex gap-2 mb-6">
              <Button onClick={() => setView('my-code')} className="flex-1">
                My Code
              </Button>
              <Button onClick={() => setView('verify')} className="flex-1">
                Verify
              </Button>
            </div>

            {/* MY CODE */}
            {view === 'my-code' && (
              <>
                {myCode ? (
                  <Card className="p-6 text-center mb-6">
                    <p className="text-4xl font-bold">{myCode}</p>
                    <Button onClick={copyCode}>
                      <Copy />
                    </Button>
                    {codeExpiry && (
                      <p className="text-sm mt-2">
                        Expires {format(codeExpiry, 'h:mm a')}
                      </p>
                    )}
                  </Card>
                ) : (
                  <Card className="p-6 text-center mb-6">
                    No code yet
                  </Card>
                )}

                <Button onClick={generateCode} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate Code'}
                </Button>
              </>
            )}

            {/* VERIFY */}
            {view === 'verify' && (
              <>
                <Input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
                />

                {error && <p className="text-red-500">{error}</p>}

                <Button onClick={validateCode} disabled={isValidating}>
                  {isValidating ? <Loader2 className="animate-spin" /> : 'Verify'}
                </Button>
              </>
            )}

          </motion.div>

        ) : (

          <motion.div key="result">

            <Card className="p-6 text-center">
              <h2 className="text-xl font-bold">
                {verificationResult.status}
              </h2>

              <p>{verificationResult.user?.full_name}</p>

              {verificationResult.partner && (
                <p>With {verificationResult.partner.full_name}</p>
              )}
            </Card>

            <Button onClick={() => setVerificationResult(null)}>
              Verify Another
            </Button>

          </motion.div>

        )}
      </AnimatePresence>
    </div>
  );
}
