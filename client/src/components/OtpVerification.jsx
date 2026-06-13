import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OtpVerification = ({ challenge, onVerified, onBack, backLabel = 'Back' }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown(value => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/verify-otp', {
        challengeId: challenge.challengeId,
        otp
      });
      onVerified(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      await axios.post('/api/auth/resend-otp', { challengeId: challenge.challengeId });
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend verification code.');
    }
  };

  return (
    <form onSubmit={verify} className="space-y-5 animate-rise">
      <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-envelope-circle-check"></i></div>
      <div><p className="text-xs uppercase tracking-[.2em] font-bold text-teal-600">Email verification</p><h2 className="text-3xl font-extrabold text-slate-900 mt-2">Enter your secure code</h2><p className="text-sm text-slate-500 mt-2">We sent a 6-digit code to <strong>{challenge.maskedEmail}</strong>. It expires in 5 minutes.</p></div>
      <input autoFocus inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="field-modern text-center text-3xl tracking-[.45em] font-extrabold" placeholder="000000" required />
      {error && <div className="text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 text-sm font-semibold">{error}</div>}
      <button type="submit" disabled={loading || otp.length !== 6} className="w-full btn-primary py-4 disabled:opacity-50">{loading ? 'Verifying...' : 'Verify and continue'}</button>
      <div className="flex justify-between text-xs font-bold"><button type="button" onClick={onBack} className="text-slate-500 hover:text-slate-800">{backLabel}</button><button type="button" disabled={cooldown > 0} onClick={resend} className="text-teal-700 disabled:text-slate-400">{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</button></div>
    </form>
  );
};

export default OtpVerification;
