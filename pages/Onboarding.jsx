import React from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Lock, CheckCircle, Loader2, Search, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

export default function Onboarding() {
  const navigate = useNavigate();

  const [step, setStep] = React.useState(1); // 1: Sign up (email+password+terms), 2: OTP, 3: Profile
  const [isLoading, setIsLoading] = React.useState(false);
  const [user, setUser] = React.useState(null);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [otpError, setOtpError] = React.useState('');

  const [formData, setFormData] = React.useState({
    full_name: '',
    date_of_birth: '',
    location: '',
    gender: ''
  });

  const [locationSearch, setLocationSearch] = React.useState('');
  const [locationSuggestions, setLocationSuggestions] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [showTermsModal, setShowTermsModal] = React.useState(false);

  const locationTimerRef = React.useRef(null);

  React.useEffect(() => {
    loadUser();
    return () => {
      if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setEmail(currentUser?.email || '');

      if (currentUser?.onboarding_completed) {
        navigate(createPageUrl('Home'), { replace: true });
        return;
      }

      // If email verified and legal accepted, go to profile
      if (currentUser?.email_verified && currentUser?.legalAccepted) {
        setStep(3);
        setFormData({
          full_name: currentUser?.full_name || '',
          date_of_birth: currentUser?.date_of_birth || '',
          location: currentUser?.location || '',
          gender: currentUser?.gender || ''
        });
        setLocationSearch(currentUser?.location || '');
      }
    } catch (error) {
      console.error('Load user failed:', error);
    }
  };

  const handleSignUp = async () => {
    if (!email || !email.includes('@')) {
      setOtpError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setOtpError('Password must be at least 6 characters');
      return;
    }

    if (!acceptTerms) {
      setOtpError('Please accept the Terms and Privacy Policy');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      // Use Base44's built-in registration which sends OTP automatically
      await base44.auth.register({
        email: email.toLowerCase(),
        password,
        full_name: email.split('@')[0], // temporary name
      });

      // Save legal acceptance
      await base44.auth.updateMe({
        legalAccepted: true,
        legalAcceptedAt: new Date().toISOString(),
        termsVersion: 'v1.0',
        privacyVersion: 'v1.0',
        refundsVersion: 'v1.0'
      });

      // Move to OTP verification
      setStep(2);
    } catch (error) {
      console.error('Sign up error:', error);
      setOtpError(error?.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setOtpError('');

    try {
      // Verify OTP using Base44's built-in verification
      await base44.auth.verifyOtp({
        email: email.toLowerCase(),
        otpCode: otp
      });

      // Beta window
      const BETA_START = new Date('2026-01-10T00:00:00Z');
      const BETA_END = new Date('2026-01-24T23:59:59Z');
      const now = new Date();
      const isBetaPeriod = now >= BETA_START && now <= BETA_END;

      await base44.auth.updateMe({
        email_verified: true,
        is_beta_user: isBetaPeriod,
        beta_signup_date: isBetaPeriod ? now.toISOString() : null,
        subscription_status: 'FREE',
        account_tier: 'FREE'
      });

      // Move to profile step after verification
      setStep(3);
    } catch (error) {
      console.error('Verify OTP error:', error);
      setOtpError(error?.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setOtpError('');

    try {
      await base44.auth.resendOtp(email.toLowerCase());
    } catch (error) {
      console.error('Resend OTP error:', error);
      setOtpError('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocations = async (query) => {
    const q = (query || '').trim();
    if (q.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `List 5 locations matching "${q}" in the format "State, Country" (e.g., "California, USA" or "Queensland, Australia"). Return ONLY JSON like {"locations":["..."]} and nothing else.`,
        response_json_schema: {
          type: 'object',
          properties: {
            locations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      setLocationSuggestions(Array.isArray(response?.locations) ? response.locations : []);
    } catch (error) {
      console.error('Location search failed:', error);
      setLocationSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({ ...prev, location: loc }));
    setLocationSearch(loc);
    setLocationSuggestions([]);
  };

  const canProceed = () => {
    return (
      (formData.full_name || '').trim() &&
      formData.date_of_birth &&
      (formData.location || '').trim() &&
      (formData.gender || '').trim()
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!canProceed() || isLoading) return;

    setIsLoading(true);
    try {
      const birthDate = new Date(formData.date_of_birth);
      if (isNaN(birthDate.getTime())) {
        alert('Invalid date of birth');
        return;
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;

      if (age < 18) {
        alert('You must be 18 or older to use Date-Locked');
        try {
          await base44.auth.logout(createPageUrl('Home'));
        } catch {}
        return;
      }

      const currentUser = await base44.auth.me();

      await base44.auth.updateMe({
        ...formData,
        relationship_status: 'single',
        onboarding_completed: true,
        subscription_status: 'FREE',
        account_tier: 'FREE',
        is_verified_adult: true,
        profile_completed: true
      });

      try {
        await base44.functions.invoke('enforceBetaTier', {
          userId: currentUser?.id,
          trigger: 'profile_completion'
        });
      } catch (error) {
        console.error('Beta tier enforcement error:', error);
      }

      navigate(createPageUrl('Home'), { replace: true });
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      alert('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const headerSubtitle =
    step === 1
      ? 'Enter your email to get started'
      : step === 2
      ? 'Enter the code we sent to your email'
      : 'Tell us a bit about yourself';

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header - only show for steps 1, 2, 3 */}
        {step > 0 && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
                Date-Locked
              </span>
            </div>

            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              {step === 1 ? 'Create Account' : step === 2 ? 'Verify Your Email' : 'Complete Your Profile'}
            </h2>

            <p className="text-slate-500">{headerSubtitle}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Email + Password + Terms */}
          {step === 1 && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Welcome Banner */}
              <div className="text-center mb-8">
                <div className="w-32 h-32 flex items-center justify-center mx-auto mb-6">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6947a97ae779b599fb632d8e/9e61ac397_DateLocked.png" alt="Date-Locked Logo" className="w-32 h-32 object-contain" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-3">
                  Date-Locked
                </h1>
                <p className="text-slate-600 text-lg mb-6">Building connections that last</p>
              </div>

              <Card className="p-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="space-y-5">
                  <div>
                    <Label className="text-slate-700">Email Address</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setOtpError('');
                      }}
                      placeholder="your@email.com"
                      className="mt-1.5 h-12 rounded-xl border-slate-200"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-700">Password</Label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setOtpError('');
                      }}
                      placeholder="At least 6 characters"
                      className="mt-1.5 h-12 rounded-xl border-slate-200"
                    />
                  </div>

                  {/* Terms acceptance */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <Checkbox
                      id="accept-terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => {
                        setAcceptTerms(checked === true);
                        setOtpError('');
                      }}
                      className="mt-1"
                    />
                    <label htmlFor="accept-terms" className="text-sm text-slate-700 leading-relaxed cursor-pointer flex-1">
                      I agree to the{' '}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        className="text-rose-600 hover:underline"
                      >
                        Terms of Use
                      </button>
                      {' '}and{' '}
                      <Link to={createPageUrl('Privacy')} target="_blank" className="text-rose-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  {otpError && <p className="text-sm text-red-500">{otpError}</p>}

                  <Button
                    onClick={handleSignUp}
                    disabled={!email || !password || !acceptTerms || isLoading}
                    className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={() => base44.auth.redirectToLogin()}
                      className="text-sm text-slate-600 hover:text-slate-800"
                    >
                      Already have an account? <span className="text-rose-600 font-medium">Log in</span>
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-rose-500" />
                    </div>
                    <p className="text-sm text-slate-600">
                      Sent to:{' '}
                      <span className="font-medium text-slate-800">{email}</span>
                    </p>
                  </div>

                  <div>
                    <Label className="text-slate-700">Enter 6-Digit Code</Label>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                        setOtpError('');
                      }}
                      placeholder="000000"
                      maxLength={6}
                      className="mt-1.5 h-14 text-center text-2xl tracking-wider font-bold"
                    />
                    {otpError && <p className="text-sm text-red-500 mt-2">{otpError}</p>}
                  </div>

                  <Button
                    onClick={handleVerifyOTP}
                    disabled={otp.length !== 6 || isLoading}
                    className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                  </Button>

                  <Button onClick={handleResendOTP} variant="ghost" disabled={isLoading} className="w-full">
                    Resend Code
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Profile Setup */}
          {step === 3 && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="p-6 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="space-y-5">
                  <div>
                    <Label className="text-slate-700">Full Name</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="mt-1.5 h-12 rounded-xl border-slate-200"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-700">Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                      className="mt-1.5 h-12 rounded-xl border-slate-200"
                    />
                    <p className="text-xs text-slate-500 mt-1">You must be 18 or older</p>
                  </div>

                  <div>
                    <Label className="text-slate-700">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="mt-1.5 h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-slate-700">Location</Label>
                    <div className="relative mt-1.5">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                      <Input
                        value={locationSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocationSearch(val);

                          if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
                          locationTimerRef.current = setTimeout(() => {
                            searchLocations(val);
                          }, 450);
                        }}
                        placeholder="State, Country (e.g., Gauteng, South Africa)"
                        className="h-12 pl-10 rounded-xl border-slate-200"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                      )}

                      {locationSuggestions.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-white rounded-xl border border-slate-200 shadow-lg z-20 max-h-60 overflow-auto">
                          {locationSuggestions.map((loc, index) => (
                            <button
                              key={`${loc}-${index}`}
                              type="button"
                              onClick={() => handleLocationSelect(loc)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors"
                            >
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-700">{loc}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleCompleteOnboarding}
                    disabled={!canProceed() || isLoading}
                    className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white mt-6"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Terms Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Terms of Use</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowTermsModal(false)}>Close</Button>
              </div>
              <div className="p-6 prose prose-sm max-w-none">
                <p className="text-sm text-gray-500">Last updated: January 16, 2026</p>

                <h3>1. Acceptance of Terms</h3>
                <p>By accessing and using Date-Locked ("the App"), you accept and agree to be bound by the terms and provision of this agreement.</p>

                <h3>2. Use License</h3>
                <p>Permission is granted to temporarily use the App for personal, non-commercial purposes. This is the grant of a license, not a transfer of title.</p>

                <h3>3. User Responsibilities</h3>
                <p>Users agree to:</p>
                <ul>
                  <li>Provide accurate and current information</li>
                  <li>Be at least 18 years of age</li>
                  <li>Not upload inappropriate, explicit, or illegal content</li>
                  <li>Respect other users and their privacy</li>
                  <li>Not engage in harassment, abuse, or threatening behavior</li>
                </ul>

                <h3>4. Content Policy</h3>
                <p>All content uploaded must comply with our community guidelines. We prohibit:</p>
                <ul>
                  <li>Nudity or sexually explicit content</li>
                  <li>Content involving minors</li>
                  <li>Violence or graphic content</li>
                  <li>Harassment or abusive content</li>
                  <li>Spam or misleading information</li>
                </ul>

                <h3>5. Account Termination</h3>
                <p>We reserve the right to terminate or suspend access to the App immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</p>

                <h3>6. Strike System</h3>
                <p>Content policy violations result in strikes. Three strikes will lead to account suspension. Severe violations may result in immediate account termination.</p>

                <h3>7. Disclaimer</h3>
                <p>The App is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, regarding the App's operation or availability.</p>

                <h3>8. Limitation of Liability</h3>
                <p>Date-Locked shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the App.</p>

                <h3>9. Changes to Terms</h3>
                <p>We reserve the right to modify these terms at any time. Continued use of the App after changes constitutes acceptance of the modified terms.</p>

                <h3>10. Contact</h3>
                <p>For questions about these Terms, please contact us through the App's support channels.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}