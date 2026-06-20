import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeToggle from '../components/ThemeToggle';
import { getSessionToken, setSessionToken } from '../utils/auth';
import OtpVerification from '../components/OtpVerification';
import { firstError, getApiFieldErrors, validateLogin } from '../utils/formValidation';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState(null);

  useEffect(() => {
    const token = getSessionToken('superAdminToken');
    if (token) navigate('/superadmin/dashboard');
  }, [navigate]);

  const handleChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
    setFieldErrors(current => {
      if (!current[e.target.name]) return current;
      const next = { ...current };
      delete next[e.target.name];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateLogin({ identifier: loginData.email, password: loginData.password });
    setFieldErrors({ email: errors.identifier, password: errors.password });
    const message = firstError(errors);
    if (message) {
      setError(message);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/login', loginData);
      if (res.data.requiresOtp) setOtpChallenge(res.data);
    } catch (err) {
      const apiErrors = getApiFieldErrors(err);
      setFieldErrors(apiErrors);
      setError(err.response?.data?.message || 'Invalid Credentials');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "field-modern";
  const errorText = message => message ? <p className="mt-2 text-xs font-bold text-red-600">{message}</p> : null;

  return (
    <div className="min-h-screen flex items-center justify-center app-shell p-4">
      <div className="fixed top-5 right-5 text-slate-700 dark:text-white"><ThemeToggle /></div>
      <div className="w-full max-w-5xl grid lg:grid-cols-2 glass-panel rounded-[32px] overflow-hidden animate-rise">
        <div className="hidden lg:flex bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 p-12 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute w-80 h-80 bg-teal-400/20 rounded-full blur-3xl -right-24 -top-24"></div>
          <div className="relative"><div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300"><i className="fas fa-heart-pulse"></i></div><p className="text-teal-300 text-xs uppercase tracking-[.25em] font-bold mt-14">Network command center</p><h1 className="text-4xl font-extrabold mt-3 leading-tight">Every clinic.<br />One clear view.</h1><p className="text-slate-300 mt-5 max-w-sm">Monitor doctor portals, patient flow, and care operations across your entire network.</p></div>
          <div className="grid grid-cols-3 gap-3"><div className="bg-white/5 border border-white/10 p-3 rounded-xl"><strong className="text-teal-300">Live</strong><p className="text-[10px] text-slate-400 mt-1">Data</p></div><div className="bg-white/5 border border-white/10 p-3 rounded-xl"><strong className="text-teal-300">Secure</strong><p className="text-[10px] text-slate-400 mt-1">Access</p></div><div className="bg-white/5 border border-white/10 p-3 rounded-xl"><strong className="text-teal-300">Smart</strong><p className="text-[10px] text-slate-400 mt-1">Insights</p></div></div>
        </div>
        <div className="p-8 sm:p-12 bg-white">
          {otpChallenge ? <OtpVerification challenge={otpChallenge} onBack={() => setOtpChallenge(null)} onVerified={(result) => { setSessionToken('superAdminToken', result.token); navigate('/superadmin/dashboard'); }} /> : <>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-8"><i className="fas fa-shield-halved"></i></div>
            <p className="text-xs uppercase tracking-[.2em] font-bold text-teal-600">Super administrator</p>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Secure access</h2>
            <p className="text-sm text-slate-500 mt-2 mb-8">Sign in to manage the CareGrid network.</p>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label className="block mb-2 text-xs uppercase tracking-wider font-bold text-slate-500">Email Address</label>
              <input type="email" name="email" autoComplete="username" required onChange={handleChange} className={inputClass} placeholder="Super admin email" />
              {errorText(fieldErrors.email)}
            </div>
            <div>
              <label className="block mb-2 text-xs uppercase tracking-wider font-bold text-slate-500">Password</label>
              <input type="password" name="password" autoComplete="current-password" required onChange={handleChange} className={inputClass} placeholder="Enter Master Password" />
              {errorText(fieldErrors.password)}
            </div>
            {error && <div className="text-red-400 text-sm font-bold text-center">{error}</div>}
            <button type="submit" disabled={loading} className="w-full btn-primary py-4">
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
            </form>
          </>}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
