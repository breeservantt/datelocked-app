import React from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Lock, Copy, Check, RefreshCw,
  Heart, Loader2, Clock, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  React.useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!mounted) return;

      setUser(currentUser);

      if (currentUser.relationship_status === 'date_locked') {
        navigate(createPageUrl('Home'));
        return;
      }

      const codes = await base44.entities.DateLockCode.filter({
        creator_email: currentUser.email,
        status: 'active'
      });

      if (mounted && codes.length > 0) {
        setDateLockCode(codes[0]);
      }
    } catch (err) {
      console.error('Error loading user:', err);
    }
  })();

  return () => {
    mounted = false;
  };
}, [navigate]);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      const response = await base44.functions.invoke('generateDateLockCode');
      
      if (response.data?.success) {
        setDateLockCode({
          code: response.data.code,
          expires_at: response.data.expires_at
        });
      } else {
        setError(response.data?.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Generate code error:', error);
      setError('Failed to generate code. Please try again.');
    }
    
    setIsGenerating(false);
  };

  const handleCopyCode = () => {
    if (dateLockCode?.code) {
      navigator.clipboard.writeText(dateLockCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRedeemCode = async (e) => {
    e.preventDefault();
    setIsRedeeming(true);
    setError('');

    try {
      const response = await base44.functions.invoke('redeemDateLockCode', {
        code: redeemCode
      });

      if (response.data?.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(createPageUrl('Home'));
        }, 2000);
      } else {
        setError(response.data?.error || 'Invalid code');
      }
    } catch (error) {
      console.error('Redeem code error:', error);
      setError(error.response?.data?.error || 'Failed to redeem code');
    }

    setIsRedeeming(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 pt-12 pb-8 px-4">
        <div className="max-w-md mx-auto">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Date-Lock Partner</h1>
          <p className="text-white/80">Share your code or enter your partner's code</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6">
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6 border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Date-Locked! 🎉</h3>
                  <p className="text-slate-600">
                    You are now officially Date-Locked together!
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Code Section */}
        <Card className="p-6 border-0 shadow-lg mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Share Your Code</h3>
              <p className="text-sm text-slate-500">Generate a code for your partner</p>
            </div>
          </div>

          {!dateLockCode ? (
            <Button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Generate Date-Lock Code
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-6 text-center border-2 border-dashed border-slate-200">
                <p className="text-sm text-slate-500 mb-2">Your Date-Lock Code</p>
                <div className="text-5xl font-bold text-slate-800 tracking-wider mb-3">
                  {dateLockCode.code}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    Expires {format(new Date(dateLockCode.expires_at), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleCopyCode}
                  variant="outline"
                  className="border-slate-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGenerateCode}
                  variant="outline"
                  className="border-slate-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Code
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-blue-800">
                  📱 Share this code with your partner verbally or through your preferred messaging app
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Redeem Code Section */}
        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Enter Partner's Code</h3>
              <p className="text-sm text-slate-500">Received a code? Enter it here</p>
            </div>
          </div>

          <form onSubmit={handleRedeemCode} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter 6-digit code"
              value={redeemCode}
              onChange={(e) => {
                setRedeemCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setError('');
              }}
              maxLength={6}
              className="text-center text-2xl tracking-wider font-bold h-14"
            />

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={redeemCode.length !== 6 || isRedeeming}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              {isRedeeming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Date-Lock Together
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Instructions */}
        <Card className="p-4 border-0 shadow-md bg-slate-50 mt-6">
          <h4 className="font-semibold text-slate-800 mb-3 text-sm">How it works:</h4>
          <ol className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="font-semibold text-rose-500">1.</span>
              <span>Generate your Date-Lock code above</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-rose-500">2.</span>
              <span>Share the code with your partner (verbally or via message)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-rose-500">3.</span>
              <span>Your partner enters the code in their app</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-rose-500">4.</span>
              <span>Both of you become Date-Locked instantly! 🔐</span>
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}