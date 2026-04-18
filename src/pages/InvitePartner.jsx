import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ArrowLeft, Loader2, Smartphone, ShieldCheck, KeyRound } from 'lucide-react';

export default function InvitePartner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get('mode') === 'accept' ? 'accept' : 'invite';

  const [phone, setPhone] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const formatPhone = (value) => value.replace(/[^\d+]/g, '').trim();
  const formatOtp = (value) => value.replace(/[^\d]/g, '').slice(0, 6);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');

    const cleanPhone = formatPhone(phone);

    if (!cleanPhone) {
      setErrorMessage('Please enter a phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('You need to be signed in first.');

      const { error } = await supabase.functions.invoke('sendPartnerOtp', {
        body: {
          phone: cleanPhone,
          sender_user_id: user.id,
        },
      });

      if (error) throw error;

      setMessage('OTP invitation sent successfully via WhatsApp.');
      setPhone('');
    } catch (error) {
      console.error('Failed to send partner OTP:', error);
      setErrorMessage(error?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptDate = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrorMessage('');

    const cleanOtp = formatOtp(otpCode);

    if (cleanOtp.length < 4) {
      setErrorMessage('Please enter the OTP sent via WhatsApp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('You need to be signed in first.');

      const { error } = await supabase.functions.invoke('acceptPartnerOtp', {
        body: {
          otp_code: cleanOtp,
          receiver_user_id: user.id,
        },
      });

      if (error) throw error;

      setMessage('Code accepted successfully. You are now Date-Locked.');
      setOtpCode('');

      setTimeout(() => {
        navigate(createPageUrl('Home'));
      }, 1200);
    } catch (error) {
      console.error('Failed to accept OTP:', error);
      setErrorMessage(error?.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInviteMode = mode === 'invite';

  return (
    <div className="min-h-screen bg-[#f3edf1] px-3 py-3 pb-[96px]">
      <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[#e8e2e7] bg-[#f7f3f6] shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
        <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-5 pb-10 pt-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="text-center">
              <p className="text-[13px] text-white/80">
                {isInviteMode ? 'Relationship Invite' : 'Accept Invitation'}
              </p>
              <h1 className="text-[20px] font-semibold text-white">
                {isInviteMode ? 'Invite Partner' : 'Accept-Date'}
              </h1>
            </div>

            <div className="h-10 w-10" />
          </div>

          <div className="mt-6 rounded-[24px] bg-white/95 px-4 py-4 shadow-[0_10px_26px_rgba(15,23,42,0.12)]">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${
                  isInviteMode ? 'bg-rose-100' : 'bg-blue-100'
                }`}
              >
                {isInviteMode ? (
                  <Heart className="h-6 w-6 text-rose-500" />
                ) : (
                  <KeyRound className="h-6 w-6 text-blue-500" />
                )}
              </div>

              <div>
                <p className="text-[16px] font-semibold text-slate-800">
                  {isInviteMode ? 'Secure OTP Invitation' : 'Enter OTP Code'}
                </p>
                <p className="text-[13px] text-slate-500">
                  {isInviteMode
                    ? 'Send a verification code to your partner’s WhatsApp number.'
                    : 'Enter the OTP your partner sent to you via WhatsApp.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="-mt-6 px-4 pb-6">
          <Card className="rounded-[24px] border-0 p-5 shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
            {isInviteMode ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-slate-700">
                    Partner WhatsApp Number
                  </label>

                  <div className="relative">
                    <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+27712345678"
                      className="h-[52px] w-full rounded-[18px] border border-slate-200 bg-white pl-12 pr-4 text-[15px] text-slate-800 outline-none transition focus:border-rose-400"
                    />
                  </div>
                </div>

                <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-500" />
                    <p className="text-[13px] leading-5 text-slate-600">
                      The OTP will be sent to your partner’s WhatsApp. They must use it to confirm
                      the relationship invitation.
                    </p>
                  </div>
                </div>

                {message ? (
                  <div className="rounded-[16px] bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                    {message}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[14px] bg-white px-3 text-[13px] font-medium text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-white"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Heart className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="leading-none">Invite</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => navigate(`${createPageUrl('InvitePartner')}?mode=accept`)}
                    className="flex h-[42px] w-full items-center justify-center rounded-[14px] bg-rose-500 px-3 text-[13px] font-medium text-white shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-rose-600"
                  >
                    <span className="leading-none">Accept-Date</span>
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAcceptDate} className="space-y-4">
                <div>
                  <label className="mb-2 block text-[13px] font-medium text-slate-700">
                    WhatsApp OTP Code
                  </label>

                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={otpCode}
                      onChange={(e) => setOtpCode(formatOtp(e.target.value))}
                      placeholder="Enter OTP code"
                      className="h-[52px] w-full rounded-[18px] border border-slate-200 bg-white pl-12 pr-4 text-[15px] tracking-[0.25em] text-slate-800 outline-none transition focus:border-rose-400"
                    />
                  </div>
                </div>

                <div className="rounded-[18px] bg-slate-50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-500" />
                    <p className="text-[13px] leading-5 text-slate-600">
                      Paste the OTP sent to you on WhatsApp to confirm the relationship and become
                      Date-Locked.
                    </p>
                  </div>
                </div>

                {message ? (
                  <div className="rounded-[16px] bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                    {message}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-[16px] bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
                    {errorMessage}
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={() => navigate(`${createPageUrl('InvitePartner')}?mode=invite`)}
                    className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[14px] bg-white px-3 text-[13px] font-medium text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-white"
                  >
                    <Heart className="h-3.5 w-3.5 shrink-0" />
                    <span className="leading-none">Invite</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-[42px] w-full items-center justify-center rounded-[14px] bg-rose-500 px-3 text-[13px] font-medium text-white shadow-[0_6px_14px_rgba(15,23,42,0.08)] hover:bg-rose-600"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span className="leading-none">Accept-Date</span>
                    )}
                  </Button>
                </div>
              </form>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl('Home'))}
              className="mt-4 h-[48px] w-full rounded-[18px] border-slate-200 text-[15px]"
            >
              Back to Home
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}