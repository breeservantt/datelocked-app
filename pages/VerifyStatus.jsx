import React from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, Key, RefreshCw, User, 
  MapPin, CheckCircle, Shield, Loader2, Copy, History
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
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const history = await base44.entities.VerificationLog.filter({
        user_email: currentUser.email
      }, '-verification_timestamp', 50);
      setVerificationHistory(history);
      
      if (currentUser.verification_code && currentUser.verification_code_expires) {
        const expiresAt = new Date(currentUser.verification_code_expires);
        if (expiresAt > new Date()) {
          setMyCode(currentUser.verification_code);
          setCodeExpiry(expiresAt);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setIsLoading(false);
  };

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const { data } = await base44.functions.invoke('verificationCode', {
        action: 'generate'
      });
      setMyCode(data.code);
      setCodeExpiry(new Date(data.expiresAt));
    } catch (error) {
      console.error('Error generating code:', error);
    }
    setIsGenerating(false);
  };

  const validateCode = async () => {
    if (!inputCode || inputCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    
    setIsValidating(true);
    setError('');
    try {
      const { data } = await base44.functions.invoke('verificationCode', {
        action: 'validate',
        code: inputCode
      });
      setVerificationResult(data);
      await loadData();
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid or expired code');
    }
    setIsValidating(false);
  };

  const copyCode = () => {
    if (myCode) {
      navigator.clipboard.writeText(myCode);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-slate-800">Date Status</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!verificationResult ? (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Toggle View */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={view === 'my-code' ? 'default' : 'outline'}
                  onClick={() => setView('my-code')}
                  className={view === 'my-code' ? 'flex-1 bg-slate-800' : 'flex-1'}
                >
                  My Code
                </Button>
                <Button
                  variant={view === 'verify-other' ? 'default' : 'outline'}
                  onClick={() => setView('verify-other')}
                  className={view === 'verify-other' ? 'flex-1 bg-slate-800' : 'flex-1'}
                >
                  Verify
                </Button>
                <Button
                  variant={view === 'history' ? 'default' : 'outline'}
                  onClick={() => setView('history')}
                  className={view === 'history' ? 'bg-slate-800' : ''}
                  size="icon"
                >
                  <History className="w-5 h-5" />
                </Button>
              </div>

              {view === 'my-code' ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Key className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                      Your Code
                    </h2>
                    <p className="text-slate-500">
                      Share to verify your status
                    </p>
                  </div>

                  {myCode ? (
                    <Card className="p-8 border-0 shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 mb-6">
                      <div className="text-center">
                        <p className="text-white/60 text-sm mb-3">Your Code</p>
                        <div className="flex items-center justify-center gap-3">
                          <p className="text-5xl font-bold text-white tracking-wider font-mono">
                            {myCode}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={copyCode}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                          >
                            <Copy className="w-5 h-5" />
                          </Button>
                        </div>
                        {codeExpiry && (
                          <p className="text-white/40 text-xs mt-4">
                            Expires {format(codeExpiry, 'h:mm a')}
                          </p>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <Card className="p-8 text-center border-0 shadow-md mb-6">
                      <Key className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-500 mb-4">No active verification code</p>
                    </Card>
                  )}

                  <Button
                    onClick={generateCode}
                    disabled={isGenerating}
                    className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        {myCode ? 'Generate New Code' : 'Generate Code'}
                      </>
                    )}
                  </Button>

                  <Card className="p-4 border-0 shadow-md bg-gradient-to-r from-blue-50 to-indigo-50 mt-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800">Secure</p>
                        <p className="text-sm text-blue-600 mt-1">
                          Codes expire after 5 minutes
                        </p>
                      </div>
                    </div>
                  </Card>
                </>
              ) : view === 'verify-other' ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                      Verify Status
                    </h2>
                    <p className="text-slate-500">
                      Enter 6-digit code
                    </p>
                  </div>

                  <Card className="p-6 border-0 shadow-md mb-6">
                    <Input
                      type="text"
                      maxLength={6}
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.replace(/\D/g, ''));
                        setError('');
                      }}
                      placeholder="000000"
                      className="text-center text-3xl font-mono tracking-widest h-16 mb-4"
                    />
                    {error && (
                      <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                    )}
                    <Button
                      onClick={validateCode}
                      disabled={isValidating || inputCode.length !== 6}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                    >
                      {isValidating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Verify Status
                        </>
                      )}
                    </Button>
                  </Card>

                  <Card className="p-4 border-0 shadow-md bg-gradient-to-r from-slate-50 to-slate-100">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-800">Private</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Only basic info is shared
                        </p>
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-800 mb-4">Verification History</h3>
                  {verificationHistory.length > 0 ? (
                    verificationHistory.map((log) => (
                      <Card key={log.id} className="p-4 border-0 shadow-md">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-slate-100 text-slate-600">
                              {log.verified_user_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{log.verified_user_name}</p>
                            <p className="text-sm text-slate-500">{log.verification_status}</p>
                            {log.partner_name && (
                              <p className="text-xs text-slate-400">with {log.partner_name}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                              {format(new Date(log.verification_timestamp), 'MMM d, yyyy • h:mm a')}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="p-8 text-center border-0 shadow-md">
                      <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500">No verification history yet</p>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  verificationResult.status === 'Date-Locked' 
                    ? 'bg-rose-100' 
                    : 'bg-slate-100'
                }`}>
                  <CheckCircle className={`w-10 h-10 ${
                    verificationResult.status === 'Date-Locked' 
                      ? 'text-rose-500' 
                      : 'text-slate-500'
                  }`} />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 mb-1">
                  Status Verified
                </h2>
                <p className="text-slate-500 text-sm">
                  {format(new Date(verificationResult.verifiedAt), 'MMMM d, yyyy • h:mm a')}
                </p>
              </div>

              <Card className="p-6 border-0 shadow-xl text-center">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-xl font-semibold ${
                  verificationResult.status === 'Date-Locked'
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {verificationResult.status}
                </div>
              </Card>

              <Card className="overflow-hidden border-0 shadow-xl">
                <div className={`h-16 ${
                  verificationResult.status === 'Date-Locked'
                    ? 'bg-gradient-to-r from-rose-400 via-pink-400 to-rose-500'
                    : 'bg-gradient-to-r from-slate-300 to-slate-400'
                }`} />
                <div className="px-6 pb-6 -mt-8">
                  <Avatar className="w-16 h-16 border-4 border-white shadow-lg mx-auto">
                    <AvatarImage src={verificationResult.user?.profile_photo} />
                    <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-rose-500 text-xl">
                      {verificationResult.user?.full_name?.[0] || <User className="w-6 h-6" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center mt-4">
                    <h3 className="text-xl font-semibold text-slate-800">
                      {verificationResult.user?.full_name}
                    </h3>
                    {verificationResult.user?.location && (
                      <div className="flex items-center justify-center gap-1 text-slate-500 text-sm mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{verificationResult.user.location}</span>
                      </div>
                    )}
                  </div>

                  {verificationResult.status === 'Date-Locked' && verificationResult.partner && (
                    <div className="mt-6 pt-6 border-t border-slate-100">
                      <p className="text-sm text-slate-500 text-center mb-3">Date-Locked with</p>
                      <div className="flex items-center gap-3 justify-center">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={verificationResult.partner.profile_photo} />
                          <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-rose-500">
                            {verificationResult.partner.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {verificationResult.partner.full_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4 border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">Verified</p>
                    <p className="text-sm text-green-600">
                      Status confirmed
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerificationResult(null);
                    setInputCode('');
                    setError('');
                  }}
                  className="flex-1"
                >
                  Verify Another
                </Button>
                <Link to={createPageUrl('Home')} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700">
                    Done
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}