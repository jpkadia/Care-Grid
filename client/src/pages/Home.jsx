import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import { useUi } from '../components/UiProvider';
import OtpVerification from '../components/OtpVerification';
import { firstError, getApiFieldErrors, passwordHelp, validateDoctorRegistration } from '../utils/formValidation';

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useUi();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [otpChallenge, setOtpChallenge] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    education: '',
    speciality: '',
    clinicName: '', 
    location: '',   
    phone: '',
    email: '',
    workDays: '',   
    visitingHours: '', 
    theme: 'gold-dark',
    password: '',
    confirmPassword: ''
  });

  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [customSpeciality, setCustomSpeciality] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [sliderImages, setSliderImages] = useState([]);

  const clearFieldError = (field) => {
    setFormErrors(current => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    clearFieldError(e.target.name);
  };

  const handleSpecialityChange = (e) => {
    const value = e.target.value;
    setSelectedSpeciality(value);
    
    if (value !== 'Other') {
        setFormData(prev => ({ ...prev, speciality: value }));
        setCustomSpeciality(''); 
        clearFieldError('speciality');
    } else {
        setFormData(prev => ({ ...prev, speciality: '' }));
    }
  };

  const handleCustomSpeciality = (e) => {
      const value = e.target.value;
      setCustomSpeciality(value);
      setFormData(prev => ({ ...prev, speciality: value }));
      clearFieldError('speciality');
  };

  const handleProfilePhoto = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setFormErrors(current => ({ ...current, profilePhoto: 'Profile photo must be smaller than 5MB.' }));
      return;
    }
    setProfilePhoto(file);
    clearFieldError('profilePhoto');
  };

  const handleSliderImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 8) {
      setFormErrors(current => ({ ...current, sliderImages: 'You can upload a maximum of 8 clinic photos.' }));
      return;
    }
    if (files.some(file => file.size > 5 * 1024 * 1024)) {
      setFormErrors(current => ({ ...current, sliderImages: 'Each clinic photo must be smaller than 5MB.' }));
      return;
    }
    setSliderImages(files);
    clearFieldError('sliderImages');
  };

  const validateRegistration = () => {
    const errors = validateDoctorRegistration({ formData, profilePhoto });
    setFormErrors(errors);
    const message = firstError(errors);
    if (message) {
      toast(message, 'error');
      setTimeout(() => {
        const firstField = Object.keys(errors)[0];
        const target = document.querySelector(`[data-field="${firstField}"] input, [data-field="${firstField}"] textarea, [data-field="${firstField}"] select, [data-field="${firstField}"]`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target?.focus?.({ preventScroll: true });
      }, 50);
      return false;
    }
    return true;
  };

  const createWebsite = async (emailVerificationToken) => {
    setLoading(true);
    try {
      const data = new FormData();
      
      data.append('name', formData.name);
      data.append('education', formData.education);
      data.append('speciality', formData.speciality);
      data.append('clinicName', formData.clinicName);
      data.append('location', formData.location);
      data.append('phone', formData.phone);
      data.append('email', formData.email);
      data.append('workDays', formData.workDays);
      data.append('visitingHours', formData.visitingHours);
      data.append('theme', formData.theme);
      data.append('password', formData.password);
      data.append('emailVerificationToken', emailVerificationToken);

      if (profilePhoto) data.append('profilePhoto', profilePhoto);
      
      for (let i = 0; i < sliderImages.length; i++) {
        data.append('sliderImages', sliderImages[i]);
      }

      const response = await axios.post('/api/doctors/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast("Website generated successfully.");
        navigate(`/doctor/${response.data.slug}`);
      }

    } catch (error) {
      setFormErrors(getApiFieldErrors(error));
      toast(error.response?.data?.message || "Error generating website.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegistration()) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/registration-otp', { email: formData.email.trim().toLowerCase() });
      setOtpChallenge(response.data);
    } catch (error) {
      setFormErrors(getApiFieldErrors(error));
      toast(error.response?.data?.message || 'Could not send verification code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "field-modern";
  const labelClass = "block mb-2 text-xs uppercase tracking-wider font-bold text-slate-500";
  const iconClass = "text-teal-600 mr-2";
  const fieldError = field => formErrors[field] ? <p className="mt-2 text-sm font-semibold text-red-600">{formErrors[field]}</p> : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-slate-800 p-4 sm:p-8 w-full overflow-x-hidden box-border bg-cover bg-center bg-fixed relative" style={{ backgroundImage: "linear-gradient(135deg, rgba(3,18,16,.90), rgba(10,90,77,.65)), url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=2000&q=85')" }}>
      {otpChallenge && <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"><div className="w-full max-w-lg bg-white rounded-[28px] shadow-2xl p-8 sm:p-10"><OtpVerification challenge={otpChallenge} backLabel="Edit details" onBack={() => setOtpChallenge(null)} onVerified={(result) => { setOtpChallenge(null); createWebsite(result.emailVerificationToken); }} /></div></div>}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(94,234,212,.25),transparent_35%)]"></div>
      
      <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[32px] overflow-hidden mt-6 mb-6 animate-rise">
        
        <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 px-5 sm:px-8 py-8 sm:py-10 text-white relative overflow-hidden">
          <div className="absolute w-64 h-64 rounded-full bg-teal-400/20 blur-3xl -right-20 -top-20"></div>
          <div className="relative flex items-start gap-4"><div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-teal-300 text-xl"><i className="fas fa-heart-pulse"></i></div><div><p className="text-xs uppercase tracking-[.25em] font-bold text-teal-300">CareGrid studio</p><h1 className="text-3xl sm:text-4xl font-extrabold mt-2">Launch your digital clinic</h1><p className="text-sm text-slate-300 mt-3 max-w-lg">Create a trusted patient-ready website and manage appointments from one beautiful workspace.</p></div></div>
        </div>
        
        <div className="p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            
            <div data-field="name">
              <label className={labelClass}><i className={`fas fa-user ${iconClass}`}></i> Doctor Name</label>
              <input type="text" name="name" value={formData.name} minLength="2" maxLength="100" placeholder="Enter your Name" required onChange={handleInputChange} className={inputClass} />
              {fieldError('name')}
            </div>

            <div data-field="education">
              <label className={labelClass}><i className={`fas fa-graduation-cap ${iconClass}`}></i> Qualification</label>
              <input type="text" name="education" value={formData.education} placeholder="Enter your Degree" required onChange={handleInputChange} className={inputClass} />
              {fieldError('education')}
            </div>

            <div data-field="speciality">
              <label className={labelClass}><i className={`fas fa-stethoscope ${iconClass}`}></i> Speciality</label>
              <select name="specialitySelect" onChange={handleSpecialityChange} required defaultValue="" className={`${inputClass} appearance-none cursor-pointer`}
                style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007bff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}>
                <option value="" disabled>-- Select Speciality --</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Dentist">Dentist</option>
                <option value="General Physician">General Physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Orthopedist">Orthopedist</option>
                <option value="Pediatrician">Pediatrician</option>
                <option value="Psychiatrist">Psychiatrist</option>
                <option value="Other">Other</option>
              </select>
              {selectedSpeciality === 'Other' && (
                  <input type="text" placeholder="Type your Speciality here" value={customSpeciality} onChange={handleCustomSpeciality} required className={`mt-3 ${inputClass}`} />
              )}
              {fieldError('speciality')}
            </div>

            <div data-field="clinicName">
              <label className={labelClass}><i className={`fas fa-hospital ${iconClass}`}></i> Clinic / Hospital Name</label>
              <input type="text" name="clinicName" value={formData.clinicName} placeholder="Enter Clinic Name" required onChange={handleInputChange} className={inputClass} />
              {fieldError('clinicName')}
            </div>

            <div data-field="location">
              <label className={labelClass}><i className={`fas fa-map-marker-alt ${iconClass}`}></i> Clinic Address</label>
              <textarea name="location" value={formData.location} rows="3" placeholder="Enter Full Address" required onChange={handleInputChange} className={`${inputClass} resize-y`}></textarea>
              {fieldError('location')}
            </div>

            <div data-field="phone">
              <label className={labelClass}><i className={`fas fa-phone ${iconClass}`}></i> Phone Number</label>
              <input type="tel" name="phone" value={formData.phone} inputMode="numeric" autoComplete="tel" pattern="\d{10}" minLength="10" maxLength="10" title="Enter exactly 10 digits" placeholder="Enter 10-digit Mobile Number" required onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); handleInputChange(e); }} className={inputClass} />
              {fieldError('phone')}
            </div>

            <div data-field="email">
              <label className={labelClass}><i className={`fas fa-envelope ${iconClass}`}></i> Email Address</label>
              <input type="email" name="email" value={formData.email} placeholder="Enter Email" required onChange={handleInputChange} className={inputClass} />
              {fieldError('email')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 mt-6">
                <div data-field="password">
                  <label className={labelClass}><i className={`fas fa-lock ${iconClass}`}></i> Create Password</label>
                  <input type="password" name="password" value={formData.password} minLength="8" autoComplete="new-password" placeholder="Create Password" required onChange={handleInputChange} className={inputClass} />
                  <p className="mt-2 text-xs font-semibold text-slate-500">{passwordHelp}</p>
                  {fieldError('password')}
                </div>
                <div data-field="confirmPassword">
                  <label className={labelClass}><i className={`fas fa-lock ${iconClass}`}></i> Confirm Password</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} minLength="8" autoComplete="new-password" placeholder="Confirm Password" required onChange={handleInputChange} className={inputClass} />
                  {fieldError('confirmPassword')}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div data-field="workDays">
                <label className={labelClass}><i className={`fas fa-calendar-alt ${iconClass}`}></i> Work Days</label>
                <select name="workDays" onChange={handleInputChange} required defaultValue="" className={`${inputClass} appearance-none cursor-pointer`}
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007bff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}>
                    <option value="" disabled>-- Select Days --</option>
                    <option value="Monday – Friday">Monday – Friday</option>
                    <option value="Monday – Saturday">Monday – Saturday</option>
                    <option value="Monday – Sunday (Daily)">Monday – Sunday (Daily)</option>
                    <option value="By Appointment Only">By Appointment Only</option>
                </select>
                {fieldError('workDays')}
                </div>

                <div data-field="visitingHours">
                <label className={labelClass}><i className={`fas fa-clock ${iconClass}`}></i> Visiting Hours</label>
                <select name="visitingHours" onChange={handleInputChange} required defaultValue="" className={`${inputClass} appearance-none cursor-pointer`}
                    style={{ backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007bff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem top 50%', backgroundSize: '0.65rem auto' }}>
                    <option value="" disabled>-- Select Hours --</option>
                    <option value="10:00 AM - 07:00 PM">10:00 AM - 07:00 PM</option>
                    <option value="09:00 AM - 05:00 PM">09:00 AM - 05:00 PM</option>
                    <option value="11:00 AM - 08:00 PM">11:00 AM - 08:00 PM</option>
                    <option value="24 Hours Open">24 Hours Open</option>
                </select>
                {fieldError('visitingHours')}
                </div>
            </div>

            <div>
              <label className={labelClass}><i className={`fas fa-palette ${iconClass}`}></i> Select Website Theme</label>
              <div className="grid sm:grid-cols-3 gap-4 mt-3">
                <label className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all bg-gradient-to-br from-[#071512] to-[#18352c] text-white ${formData.theme === 'gold-dark' ? 'border-amber-400 shadow-lg -translate-y-1' : 'border-transparent opacity-80'}`}>
                    <input type="radio" name="theme" value="gold-dark" onChange={handleInputChange} checked={formData.theme === 'gold-dark'} className="sr-only" />
                    <span className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.theme === 'gold-dark' ? 'border-amber-300 bg-amber-300 text-black' : 'border-white/50'}`}>{formData.theme === 'gold-dark' && <i className="fas fa-check text-[9px]"></i>}</span>
                    <i className="fas fa-crown text-amber-300"></i><span className="block font-bold mt-5">Gold Signature</span><span className="text-[10px] opacity-60">Premium and warm</span>
                </label>
                <label className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all bg-gradient-to-br from-blue-600 to-sky-400 text-white ${formData.theme === 'classic-blue' ? 'border-blue-900 shadow-lg -translate-y-1' : 'border-transparent opacity-80'}`}>
                    <input type="radio" name="theme" value="classic-blue" onChange={handleInputChange} checked={formData.theme === 'classic-blue'} className="sr-only" />
                    <span className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.theme === 'classic-blue' ? 'border-white bg-white text-blue-600' : 'border-white/50'}`}>{formData.theme === 'classic-blue' && <i className="fas fa-check text-[9px]"></i>}</span>
                    <i className="fas fa-droplet"></i><span className="block font-bold mt-5">Classic Blue</span><span className="text-[10px] opacity-70">Clear and trusted</span>
                </label>
                <label className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all bg-gradient-to-br from-emerald-700 to-teal-400 text-white ${formData.theme === 'nature-green' ? 'border-emerald-950 shadow-lg -translate-y-1' : 'border-transparent opacity-80'}`}>
                    <input type="radio" name="theme" value="nature-green" onChange={handleInputChange} checked={formData.theme === 'nature-green'} className="sr-only" />
                    <span className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.theme === 'nature-green' ? 'border-white bg-white text-emerald-600' : 'border-white/50'}`}>{formData.theme === 'nature-green' && <i className="fas fa-check text-[9px]"></i>}</span>
                    <i className="fas fa-leaf"></i><span className="block font-bold mt-5">Nature Green</span><span className="text-[10px] opacity-70">Calm and restorative</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200" data-field="profilePhoto">
              <label className={labelClass}><i className={`fas fa-camera ${iconClass}`}></i> Profile Photo</label>
              <div className="flex justify-center">
                <FileUpload label="Upload profile photo" hint="JPG, PNG or WebP, maximum 5MB" compact required onChange={handleProfilePhoto} onDiscard={() => setProfilePhoto(null)} files={profilePhoto} icon="fa-user-doctor" error={formErrors.profilePhoto} />
              </div>
            </div>

            <div data-field="sliderImages">
              <label className={labelClass}><i className={`fas fa-images ${iconClass}`}></i> Clinic Photos (Max 8)</label>
              <FileUpload label="Upload clinic gallery" hint="Up to 8 JPG, PNG or WebP images, maximum 5MB each" multiple onChange={handleSliderImages} onDiscard={(index) => setSliderImages(current => current.filter((_, itemIndex) => itemIndex !== index))} files={sliderImages} icon="fa-images" error={formErrors.sliderImages} />
            </div>

            <button type="submit" disabled={loading} 
                className="w-full btn-primary py-4 px-6 disabled:bg-slate-400 disabled:cursor-not-allowed flex justify-center items-center gap-3 mt-8 text-lg">
              {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Website...
                </>
              ) : (
                <>Launch My Website <i className="fas fa-rocket"></i></>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
