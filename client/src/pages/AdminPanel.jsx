import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppointmentManager from '../components/AppointmentManager';
import AdminChatbot from '../components/AdminChatbot';
import DashboardAnalytics from '../components/DashboardAnalytics';
import ThemeToggle from '../components/ThemeToggle';
import { useUi } from '../components/UiProvider';
import { clearSessionToken, getSessionToken, setSessionToken } from '../utils/auth';
import FileUpload from '../components/FileUpload';
import OtpVerification from '../components/OtpVerification';

const AdminPanel = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useUi();
  const tokenKey = `adminToken_${slug}`;
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [otpChallenge, setOtpChallenge] = useState(null);
  const [forgotStage, setForgotStage] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPasswords, setNewPasswords] = useState({ newPassword: '', confirmPassword: '' });

  const [doctorData, setDoctorData] = useState(null);
  
  const [editData, setEditData] = useState({
    name: '', education: '', speciality: '', clinicName: '', location: '',
    phone: '', email: '', workDays: '', visitingHours: '', theme: '',
    tagline: '', heroHeadline: '', about: '', services: ''
  });
  
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [sliderImages, setSliderImages] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);

  const fetchDoctorData = useCallback(async () => {
    try {
      const token = getSessionToken(tokenKey);
      const res = await axios.get(`/api/doctors/${slug}/session`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const d = res.data.data;
        setDoctorData(d);
        setEditData({
          name: d.name || '',
          education: d.personalDetails?.education || '',
          speciality: d.personalDetails?.speciality || '',
          clinicName: d.personalDetails?.clinicName || '',
          location: d.personalDetails?.location || '',
          phone: d.personalDetails?.phone || '',
          email: d.personalDetails?.email || '',
          workDays: d.personalDetails?.workDays || '',
          visitingHours: d.personalDetails?.visitingHours || '',
          theme: d.theme || 'gold-dark',
          tagline: d.aiContent?.tagline || '',
          heroHeadline: d.aiContent?.heroHeadline || '',
          about: d.aiContent?.about || '',
          services: d.aiContent?.services ? d.aiContent.services.join(', ') : ''
        });
      }
    } catch (err) {
      if (err.response?.status === 404) navigate('/');
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearSessionToken(tokenKey);
        setIsLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, slug, tokenKey]);

  useEffect(() => {
    const token = getSessionToken(tokenKey);
    if (token) {
      setIsLoggedIn(true);
      fetchDoctorData();
    } else {
      setLoading(false);
    }
  }, [fetchDoctorData, slug, tokenKey]);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setLoginError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`/api/doctors/${slug}/login`, loginData);
      if (res.data.requiresOtp) setOtpChallenge(res.data);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid Login');
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await axios.post(`/api/doctors/${slug}/forgot-password`, { email: resetEmail });
      setOtpChallenge(res.data);
      setForgotStage('otp');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Could not start password reset.');
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const res = await axios.post(`/api/doctors/${slug}/reset-password`, { resetToken, ...newPasswords });
      toast(res.data.message);
      setForgotStage(null);
      setOtpChallenge(null);
      setResetToken('');
      setNewPasswords({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    clearSessionToken(tokenKey);
    setIsLoggedIn(false);
    setDoctorData(null);
  }, [tokenKey]);

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) return toast('Profile photo must be smaller than 5MB.', 'error');
    setProfilePhoto(file);
  };

  const handleSliderImagesChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 8) return toast('You can upload a maximum of 8 clinic photos.', 'error');
    if (files.some(file => file.size > 5 * 1024 * 1024)) return toast('Each clinic photo must be smaller than 5MB.', 'error');
    setSliderImages(files);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const token = getSessionToken(tokenKey);
      const formData = new FormData();
      
      Object.keys(editData).forEach(key => {
        formData.append(key, editData[key]);
      });

      if (profilePhoto) formData.append('profilePhoto', profilePhoto);
      
      if (sliderImages.length > 0) {
        for (let i = 0; i < sliderImages.length; i++) {
          formData.append('sliderImages', sliderImages[i]);
        }
      }

      const res = await axios.put(`/api/doctors/${slug}/update`, formData, {
        headers: { 
            Authorization: `Bearer ${token}`
        },
        timeout: 120000
      });

      if (res.data.success) {
        toast("Profile updated successfully.");
        setDoctorData(res.data.data);
        setProfilePhoto(null);
        setSliderImages([]);
      }
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update profile.", 'error');
      if (err.response?.status === 401) handleLogout();
    } finally {
      setUpdateLoading(false);
    }
  };

  const inputClass = "field-modern";
  const labelClass = "block mb-2 text-xs uppercase tracking-wider font-bold text-slate-500";
  const cardClass = "dashboard-card overflow-hidden";
  const cardHeaderClass = "px-6 py-5 border-b border-slate-100 font-extrabold text-slate-900 text-lg flex items-center gap-3";

  if (loading) return <div className="min-h-screen flex items-center justify-center app-shell text-teal-700 text-xl font-bold"><i className="fas fa-circle-notch animate-spin mr-3"></i>Preparing dashboard...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center app-shell p-4">
        <div className="fixed top-5 right-5 text-slate-700 dark:text-white"><ThemeToggle /></div>
        <div className="w-full max-w-5xl grid lg:grid-cols-2 glass-panel rounded-[32px] overflow-hidden animate-rise">
          <div className="hidden lg:flex bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 p-12 text-white flex-col justify-between relative overflow-hidden">
            <div className="absolute w-72 h-72 bg-teal-400/20 rounded-full blur-3xl -right-20 -top-20"></div>
            <div className="relative"><div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-teal-300 text-xl"><i className="fas fa-heart-pulse"></i></div><p className="text-teal-300 text-xs uppercase tracking-[.25em] font-bold mt-12">CareGrid workspace</p><h1 className="text-4xl font-extrabold mt-3 leading-tight">Your practice,<br />beautifully organized.</h1><p className="text-slate-300 mt-5 max-w-sm">Appointments, patient flow and your digital clinic presence in one secure workspace.</p></div>
            <div className="relative flex items-center gap-3 text-sm text-slate-300"><i className="fas fa-shield-halved text-teal-300"></i> Protected doctor access</div>
          </div>
          <div className="p-8 sm:p-12 bg-white">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-8 lg:hidden"><i className="fas fa-heart-pulse"></i></div>
            {forgotStage === 'reset' ? <form onSubmit={submitNewPassword} className="space-y-5 animate-rise">
              <p className="text-xs uppercase tracking-[.2em] font-bold text-teal-600">Account recovery</p>
              <h2 className="text-3xl font-extrabold text-slate-900">Create new password</h2>
              <p className="text-sm text-slate-500">Use at least 8 characters with uppercase, lowercase, number and special character.</p>
              <input type="password" autoComplete="new-password" required minLength="8" className={inputClass} placeholder="New password" value={newPasswords.newPassword} onChange={(e) => setNewPasswords({ ...newPasswords, newPassword: e.target.value })} />
              <input type="password" autoComplete="new-password" required minLength="8" className={inputClass} placeholder="Confirm new password" value={newPasswords.confirmPassword} onChange={(e) => setNewPasswords({ ...newPasswords, confirmPassword: e.target.value })} />
              {loginError && <div className="text-red-500 text-sm font-bold">{loginError}</div>}
              <button disabled={loading} type="submit" className="w-full btn-primary py-4">{loading ? 'Updating...' : 'Update password'}</button>
              <button type="button" onClick={() => setForgotStage(null)} className="text-sm font-bold text-slate-500">Back to login</button>
            </form> : forgotStage === 'otp' && otpChallenge ? <OtpVerification challenge={otpChallenge} onBack={() => { setForgotStage('request'); setOtpChallenge(null); }} onVerified={(result) => { setResetToken(result.resetToken); setForgotStage('reset'); setOtpChallenge(null); }} /> : forgotStage === 'request' ? <form onSubmit={requestPasswordReset} className="space-y-5 animate-rise">
              <p className="text-xs uppercase tracking-[.2em] font-bold text-teal-600">Account recovery</p>
              <h2 className="text-3xl font-extrabold text-slate-900">Forgot password?</h2>
              <p className="text-sm text-slate-500">Enter the email registered with this doctor website. We will send a secure verification code.</p>
              <input type="email" autoComplete="email" required className={inputClass} placeholder="Registered email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              {loginError && <div className="text-red-500 text-sm font-bold">{loginError}</div>}
              <button disabled={loading} type="submit" className="w-full btn-primary py-4">{loading ? 'Sending...' : 'Send verification code'}</button>
              <button type="button" onClick={() => { setForgotStage(null); setLoginError(''); }} className="text-sm font-bold text-slate-500">Back to login</button>
            </form> : otpChallenge ? <OtpVerification challenge={otpChallenge} onBack={() => setOtpChallenge(null)} onVerified={(result) => { setSessionToken(tokenKey, result.token); setIsLoggedIn(true); setOtpChallenge(null); fetchDoctorData(); }} /> : <>
              <p className="text-xs uppercase tracking-[.2em] font-bold text-teal-600">Doctor portal</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">Welcome back</h2>
              <p className="text-sm text-slate-500 mt-2 mb-8">Manage portal for <span className="font-bold text-teal-700">{slug}</span></p>
              <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className={labelClass}>Email or Mobile Number</label>
                <input type="text" name="identifier" autoComplete="username" required onChange={handleLoginChange} className={inputClass} placeholder="Registered Email or Phone" />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" name="password" autoComplete="current-password" required onChange={handleLoginChange} className={inputClass} placeholder="Enter Password" />
              </div>
              <div className="text-right"><button type="button" onClick={() => { setForgotStage('request'); setLoginError(''); }} className="text-sm font-bold text-teal-700 hover:text-teal-900">Forgot password?</button></div>
              {loginError && <div className="text-red-500 text-sm font-bold text-center">{loginError}</div>}
              <button type="submit" className="w-full btn-primary py-4">Login to Dashboard <i className="fas fa-arrow-right ml-2"></i></button>
              </form>
            </>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-shell pb-12">
      <header className="bg-slate-950/95 backdrop-blur-xl text-white px-4 sm:px-8 py-4 shadow-xl flex justify-between items-center sticky top-0 z-40 border-b border-white/5">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center"><i className="fas fa-heart-pulse"></i></div><div><h1 className="text-base sm:text-lg font-extrabold">CareGrid</h1><p className="text-[10px] uppercase tracking-widest text-teal-300">Doctor workspace</p></div></div>
        <div className="flex gap-2 sm:gap-3">
            <ThemeToggle />
            <button onClick={() => window.open(`/doctor/${slug}`, '_blank')} className="bg-white/10 hover:bg-white/15 px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors"><i className="fas fa-arrow-up-right-from-square sm:mr-2"></i><span className="hidden sm:inline">Live Site</span></button>
            <button onClick={handleLogout} className="bg-red-500/10 text-red-300 hover:bg-red-500/20 px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-colors"><i className="fas fa-power-off sm:mr-2"></i><span className="hidden sm:inline">Logout</span></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto mt-8 px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 animate-rise"><div><p className="text-xs uppercase tracking-[.2em] font-bold text-teal-600">Practice overview</p><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-2">Good day, {doctorData?.name}</h2><p className="text-slate-500 mt-2">Here is what is happening with your clinic today.</p></div><span className="text-xs font-semibold bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
        <DashboardAnalytics appointments={appointments} />
        <AppointmentManager
          listUrl={`/api/doctors/${slug}/appointments`}
          statusUrl={(id) => `/api/doctors/${slug}/appointments/${id}/status`}
          token={getSessionToken(tokenKey)}
          title="Patient Appointment Requests"
          onUnauthorized={handleLogout}
          onData={setAppointments}
        />
        
        <div className="pt-4"><p className="text-xs uppercase tracking-[.2em] font-bold text-teal-600">Website settings</p><h2 className="text-2xl font-extrabold text-slate-900 mt-2">Manage your digital clinic</h2></div>
        <form onSubmit={handleUpdateSubmit} className="grid xl:grid-cols-2 gap-6">
          
          <div className={cardClass}>
            <div className={cardHeaderClass}><i className="fas fa-id-card text-blue-500"></i> Personal & Professional Info</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className={labelClass}>Doctor Name</label><input type="text" name="name" value={editData.name} onChange={handleEditChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Qualification</label><input type="text" name="education" value={editData.education} onChange={handleEditChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Speciality</label><input type="text" name="speciality" value={editData.speciality} onChange={handleEditChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Login Email Address</label><input type="email" name="email" value={editData.email} className={`${inputClass} cursor-not-allowed opacity-70`} readOnly /><p className="text-xs text-slate-500 mt-2">For account security, contact the super admin to change this email.</p></div>
            </div>
          </div>

          <div className={cardClass}>
            <div className={cardHeaderClass}><i className="fas fa-clinic-medical text-blue-500"></i> Clinic Details & Timings</div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className={labelClass}>Clinic / Hospital Name</label><input type="text" name="clinicName" value={editData.clinicName} onChange={handleEditChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Phone Number</label><input type="tel" name="phone" inputMode="numeric" pattern="\d{10}" minLength="10" maxLength="10" title="Enter exactly 10 digits" value={editData.phone} onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); handleEditChange(e); }} className={inputClass} required /></div>
              <div className="md:col-span-2"><label className={labelClass}>Clinic Address</label><textarea name="location" value={editData.location} onChange={handleEditChange} rows="2" className={`${inputClass} resize-y`} required></textarea></div>
              <div>
                <label className={labelClass}>Work Days</label>
                <select name="workDays" value={editData.workDays} onChange={handleEditChange} className={inputClass} required>
                  <option value="Monday – Friday">Monday – Friday</option>
                  <option value="Monday – Saturday">Monday – Saturday</option>
                  <option value="Monday – Sunday (Daily)">Monday – Sunday (Daily)</option>
                  <option value="By Appointment Only">By Appointment Only</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Visiting Hours</label>
                <select name="visitingHours" value={editData.visitingHours} onChange={handleEditChange} className={inputClass} required>
                  <option value="10:00 AM - 07:00 PM">10:00 AM - 07:00 PM</option>
                  <option value="09:00 AM - 05:00 PM">09:00 AM - 05:00 PM</option>
                  <option value="11:00 AM - 08:00 PM">11:00 AM - 08:00 PM</option>
                  <option value="24 Hours Open">24 Hours Open</option>
                </select>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className={cardHeaderClass}><i className="fas fa-file-alt text-blue-500"></i> Website Content & Theme</div>
            <div className="p-6 space-y-6">
              <div>
                <label className={labelClass}>Website Theme</label>
                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <label className={`flex-1 flex justify-center p-3 cursor-pointer rounded-xl font-bold border-2 transition-transform bg-yellow-400 text-black ${editData.theme === 'gold-dark' ? 'border-black scale-105 shadow-md' : 'border-transparent opacity-70'}`}>
                      <input type="radio" name="theme" value="gold-dark" checked={editData.theme === 'gold-dark'} onChange={handleEditChange} className="hidden" /> Gold Signature
                  </label>
                  <label className={`flex-1 flex justify-center p-3 cursor-pointer rounded-xl font-bold border-2 transition-transform bg-blue-600 text-white ${editData.theme === 'classic-blue' ? 'border-slate-900 scale-105 shadow-md' : 'border-transparent opacity-70'}`}>
                      <input type="radio" name="theme" value="classic-blue" checked={editData.theme === 'classic-blue'} onChange={handleEditChange} className="hidden" /> Classic Blue
                  </label>
                  <label className={`flex-1 flex justify-center p-3 cursor-pointer rounded-xl font-bold border-2 transition-transform bg-green-500 text-white ${editData.theme === 'nature-green' ? 'border-slate-900 scale-105 shadow-md' : 'border-transparent opacity-70'}`}>
                      <input type="radio" name="theme" value="nature-green" checked={editData.theme === 'nature-green'} onChange={handleEditChange} className="hidden" /> Nature Green
                  </label>
                </div>
              </div>
              <div><label className={labelClass}>Tagline (Catchy phrase)</label><input type="text" name="tagline" value={editData.tagline} onChange={handleEditChange} className={inputClass} required /></div>
              <div><label className={labelClass}>Homepage Hero Headline</label><input type="text" name="heroHeadline" maxLength="80" value={editData.heroHeadline} onChange={handleEditChange} className={inputClass} required /></div>
              <div><label className={labelClass}>About Section (Bio)</label><textarea name="about" value={editData.about} onChange={handleEditChange} rows="4" className={`${inputClass} resize-y`} required></textarea></div>
              <div><label className={labelClass}>Treatments / Services (Comma Separated)</label><textarea name="services" value={editData.services} onChange={handleEditChange} rows="2" className={`${inputClass} resize-y`} required></textarea></div>
            </div>
          </div>

          <div className={cardClass}>
            <div className={cardHeaderClass}><i className="fas fa-camera text-blue-500"></i> Media Management</div>
            <div className="p-6 space-y-6">
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <label className={labelClass}>Update Profile Photo</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-2">
                  <img src={doctorData?.photoUrl} alt="Current" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                  <div className="flex-1"><FileUpload label="Replace profile photo" hint="JPG, PNG or WebP, maximum 5MB" compact onChange={handleProfilePhotoChange} onDiscard={() => setProfilePhoto(null)} files={profilePhoto} icon="fa-user-doctor" /></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Leave blank to keep your current photo.</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <label className={labelClass}>Update Clinic Photos (Select multiple to replace existing)</label>
                <FileUpload label="Replace clinic gallery" hint="Up to 8 images, maximum 5MB each" multiple onChange={handleSliderImagesChange} onDiscard={(index) => setSliderImages(current => current.filter((_, itemIndex) => itemIndex !== index))} files={sliderImages} icon="fa-images" />
                <p className="text-xs text-slate-500 mt-2">Selecting new files will replace your current {doctorData?.sliderImages?.length || 0} slider images. Leave blank to keep current images.</p>
              </div>

            </div>
          </div>

          <button type="submit" disabled={updateLoading} className="xl:col-span-2 w-full btn-primary py-5 text-lg flex justify-center items-center gap-3">
              {updateLoading ? 'Applying Changes...' : <><i className="fas fa-cloud-upload-alt"></i> Publish All Changes to Live Site</>}
          </button>

        </form>
      </main>
      <AdminChatbot
        endpoint={`/api/doctors/${slug}/chat`}
        historyEndpoint={`/api/doctors/${slug}/chat/history`}
        token={getSessionToken(tokenKey)}
        title="Doctor Admin Assistant"
      />
    </div>
  );
};

export default AdminPanel;
