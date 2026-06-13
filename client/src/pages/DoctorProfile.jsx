import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import GallerySlider from '../components/GallerySlider';
import ThemeToggle from '../components/ThemeToggle';

const DoctorProfile = () => {
  const { slug } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentNotice, setAppointmentNotice] = useState({ type: '', text: '' });
  const [appointmentForm, setAppointmentForm] = useState({
    patientName: '', phone: '', email: '', treatment: '', preferredDate: '', timeSlot: '', message: ''
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem(`doctorSiteMode_${slug}`) === 'dark');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 450);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const res = await axios.get(`/api/doctors/${slug}`);
        if (res.data.success) {
          setDoctor(res.data.data);
        }
      } catch {
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorData();
  }, [slug]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  const scrollToFooter = () => {
    const footer = document.getElementById('site-footer');
    if (footer) footer.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAppointmentChange = (e) => {
    setAppointmentForm(current => ({ ...current, [e.target.name]: e.target.value }));
    setAppointmentNotice({ type: '', text: '' });
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setAppointmentLoading(true);
    setAppointmentNotice({ type: '', text: '' });
    try {
      const res = await axios.post(`/api/doctors/${slug}/appointments`, appointmentForm);
      setAppointmentNotice({ type: 'success', text: res.data.message });
      setAppointmentForm({ patientName: '', phone: '', email: '', treatment: '', preferredDate: '', timeSlot: '', message: '' });
      setTimeout(() => {
        setIsModalOpen(false);
        setAppointmentNotice({ type: '', text: '' });
      }, 900);
    } catch (error) {
      setAppointmentNotice({ type: 'error', text: error.response?.data?.message || 'Could not submit appointment request.' });
    } finally {
      setAppointmentLoading(false);
    }
  };

  const defaultTestimonials = [
    {
      name: "Amit Patel",
      text: `Dr. ${doctor?.name || 'The Doctor'} is incredibly professional. The treatment helped me recover very fast. Highly recommended!`,
    },
    {
      name: "Sneha Sharma",
      text: "Great experience at the clinic. The staff is polite and the doctor listens patiently to all concerns.",
    }
  ];

  const testimonials = doctor?.testimonials && doctor.testimonials.length > 0 
    ? doctor.testimonials 
    : defaultTestimonials;
  const displayServices = [...new Set([
    ...(doctor?.aiContent?.services || []),
    'Specialist Consultation',
    'Preventive Health Guidance',
    'Diagnosis and Evaluation',
    'Personalized Treatment Planning',
    'Follow-up Care',
    'Long-term Wellness Support'
  ])].slice(0, 8);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xl">Loading...</div>;
  if (!doctor) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xl">Doctor Profile Not Found (404)</div>;

  const themes = {
    'gold-dark': {
        bg: 'bg-[#071512]', text: 'text-white', cardBg: 'bg-[#0d211c]/90', borderColor: 'border-white/10', borderHover: 'hover:border-amber-300/60',
        accentHex: '#f4c95d', accentBg: 'bg-amber-300', accentText: 'text-amber-300', btnText: 'text-slate-950', reviewBg: 'bg-white/5'
    },
    'classic-blue': {
        bg: 'bg-[#f4f9ff]', text: 'text-slate-800', cardBg: 'bg-white/90', borderColor: 'border-blue-100', borderHover: 'hover:border-blue-400',
        accentHex: '#1677ff', accentBg: 'bg-blue-600', accentText: 'text-blue-600', btnText: 'text-white', reviewBg: 'bg-blue-50'
    },
    'nature-green': {
        bg: 'bg-[#f1fbf7]', text: 'text-slate-800', cardBg: 'bg-white/90', borderColor: 'border-emerald-100', borderHover: 'hover:border-emerald-400',
        accentHex: '#0f9f7f', accentBg: 'bg-emerald-600', accentText: 'text-emerald-600', btnText: 'text-white', reviewBg: 'bg-emerald-50'
    }
  };

  const baseTheme = themes[doctor.theme] || themes['gold-dark'];
  const t = isDark ? {
    ...baseTheme,
    bg: 'bg-[#071512]', text: 'text-white', cardBg: 'bg-[#0d211c]/90', borderColor: 'border-white/10', reviewBg: 'bg-white/5'
  } : {
    ...baseTheme,
    bg: doctor.theme === 'classic-blue' ? 'bg-[#f4f9ff]' : 'bg-[#f1fbf7]', text: 'text-slate-800', cardBg: 'bg-white/90',
    borderColor: doctor.theme === 'classic-blue' ? 'border-blue-100' : 'border-emerald-100', reviewBg: doctor.theme === 'classic-blue' ? 'bg-blue-50' : 'bg-emerald-50'
  };
  const toggleSiteMode = (next) => {
    setIsDark(next);
    localStorage.setItem(`doctorSiteMode_${slug}`, next ? 'dark' : 'light');
  };
  const mapQuery = [doctor.personalDetails.clinicName, doctor.personalDetails.location, 'India'].filter(Boolean).join(', ');

  return (
    <div className={`${t.bg} ${t.text} w-full min-h-screen relative overflow-x-hidden transition-colors duration-500`}>
      
      <style>{`
        @keyframes customSpin { 100% { transform: rotate(360deg); } }
        @keyframes slideLeft { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>

      <section className="relative min-h-screen flex flex-col items-center text-center">
        
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -right-20 w-[520px] h-[520px] rounded-full blur-3xl opacity-20" style={{ backgroundColor: t.accentHex }}></div>
            <div className="absolute top-[35%] -left-40 w-[420px] h-[420px] rounded-full blur-3xl opacity-10" style={{ backgroundColor: t.accentHex }}></div>
        </div>

        <header className={`fixed top-0 left-0 w-full ${t.cardBg} ${t.borderColor} border-b px-4 sm:px-8 py-3 flex items-center justify-between z-30 shadow-xl backdrop-blur-xl gap-4`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0"><div className={`${t.accentBg} ${t.btnText} w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center`}><i className="fas fa-heart-pulse"></i></div><div className="min-w-0"><div className="font-extrabold text-xs sm:text-base truncate max-w-[110px] sm:max-w-none">{doctor.name}</div><div className="hidden sm:block text-[10px] uppercase tracking-widest opacity-50 truncate">{doctor.personalDetails.speciality}</div></div>
          </div>

          <div className="flex gap-2 sm:gap-3 shrink-0">
            <ThemeToggle value={isDark} onChange={toggleSiteMode} />
            <button onClick={() => setIsModalOpen(true)} className={`${t.accentBg} ${t.btnText} px-4 sm:px-5 py-2.5 rounded-xl font-bold shadow-md transition-transform hover:-translate-y-0.5 text-xs sm:text-sm`}>
                <i className="fas fa-calendar-check sm:mr-2"></i><span className="hidden sm:inline">Book Appointment</span>
            </button>
            <button onClick={scrollToFooter} className={`hidden sm:block bg-transparent border ${t.borderColor} px-5 py-2.5 rounded-xl font-bold transition-colors text-sm`}>
                Contact
            </button>
          </div>
        </header>

        <div className="relative z-10 pt-32 pb-20 px-4 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-3 grid lg:grid-cols-[1.35fr_.65fr] gap-8 items-center min-h-[540px] animate-rise">
            <div className="text-left order-2 lg:order-1">
              <div className={`inline-flex items-center gap-2 ${t.cardBg} ${t.borderColor} border px-4 py-2 rounded-full text-xs font-bold mb-6`}><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> Accepting appointment requests</div>
              <p className={`text-xs uppercase tracking-[.25em] font-bold ${t.accentText}`}>{doctor.personalDetails.education} · {doctor.personalDetails.speciality}</p>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] mt-4 max-w-3xl break-words" style={{ color: t.accentHex }}>{doctor.aiContent?.heroHeadline || doctor.aiContent?.tagline || 'Thoughtful care, centered on you.'}</h1>
              <p className="text-base sm:text-lg opacity-65 leading-relaxed mt-6 max-w-2xl">{doctor.aiContent?.about}</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8"><button onClick={() => setIsModalOpen(true)} className={`${t.accentBg} ${t.btnText} px-6 py-4 rounded-2xl font-bold shadow-xl hover:-translate-y-1 transition-transform`}><i className="fas fa-calendar-check mr-2"></i>Book an appointment</button><a href={`tel:${doctor.personalDetails.phone}`} className={`${t.cardBg} ${t.borderColor} border px-6 py-4 rounded-2xl font-bold text-center hover:-translate-y-1 transition-transform`}><i className="fas fa-phone mr-2"></i>Call clinic</a></div>
              <div className="grid grid-cols-3 gap-3 mt-10 max-w-xl"><div><strong className="text-xl">{displayServices.length}+</strong><p className="text-xs opacity-50 mt-1">Services</p></div><div><strong className="text-xl">Easy</strong><p className="text-xs opacity-50 mt-1">Booking</p></div><div><strong className="text-xl">Patient</strong><p className="text-xs opacity-50 mt-1">First care</p></div></div>
            </div>
            <div className="relative order-1 lg:order-2 flex justify-center animate-float">
              <div className="absolute inset-8 rounded-[48px] rotate-6 opacity-25" style={{ backgroundColor: t.accentHex }}></div>
              <div className={`relative w-full max-w-sm aspect-[4/5] rounded-[42px] overflow-hidden border-8 ${t.borderColor} shadow-2xl bg-white`}>
                <img src={doctor.photoUrl || "https://via.placeholder.com/300"} alt={doctor.name} className="w-full h-full object-cover" />
              </div>
              <div className={`absolute -bottom-5 -left-2 ${t.cardBg} ${t.borderColor} border backdrop-blur-xl px-5 py-4 rounded-2xl shadow-xl`}><p className="text-[10px] uppercase tracking-widest opacity-50">Clinic hours</p><p className="font-bold mt-1">{doctor.personalDetails.visitingHours}</p></div>
            </div>
          </div>

          <div className={`lg:col-span-1 ${t.cardBg} ${t.borderColor} border rounded-3xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300 ${t.borderHover} animate-rise`}>
            <div className={`${t.accentBg} ${t.btnText} px-6 py-4 font-bold flex items-center gap-3 uppercase tracking-wider text-sm`}>
              <i className="fas fa-user-tie text-lg"></i> About {doctor.name}
            </div>
            <div className="p-6 text-left">
              <p className="italic mb-4 opacity-90 text-lg">"{doctor.aiContent?.tagline}"</p>
              <p className="mb-6 leading-relaxed opacity-80">{doctor.aiContent?.about}</p>
              
              <ul className="space-y-3">
                <li className="relative pl-6"><span className="absolute left-0 top-0 font-bold text-lg" style={{ color: t.accentHex }}>•</span><strong>Speciality:</strong> {doctor.personalDetails.speciality}</li>
                <li className="relative pl-6"><span className="absolute left-0 top-0 font-bold text-lg" style={{ color: t.accentHex }}>•</span><strong>Location:</strong> {doctor.personalDetails.location}</li>
                <li className="relative pl-6"><span className="absolute left-0 top-0 font-bold text-lg" style={{ color: t.accentHex }}>•</span><strong>Email:</strong> {doctor.personalDetails.email || "Not Available"}</li>
              </ul>
            </div>
          </div>

          <div className={`lg:col-span-1 ${t.cardBg} ${t.borderColor} border rounded-3xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300 ${t.borderHover} animate-rise`}>
            <div className={`${t.accentBg} ${t.btnText} px-6 py-4 font-bold flex items-center gap-3 uppercase tracking-wider text-sm`}>
               <i className="fas fa-notes-medical text-lg"></i> Treatments Offered
            </div>
            <div className="p-6 text-left">
              <ul className="space-y-4">
                {displayServices.map((service, index) => (
                  <li key={index} className="relative pl-6 leading-relaxed opacity-90"><span className="absolute left-0 top-0 font-bold text-lg" style={{ color: t.accentHex }}>•</span>{service}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className={`lg:col-span-1 ${t.cardBg} ${t.borderColor} border rounded-3xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300 ${t.borderHover} animate-rise`}>
            <div className={`${t.accentBg} ${t.btnText} px-6 py-4 font-bold flex items-center gap-3 uppercase tracking-wider text-sm`}>
              <i className="fas fa-clock text-lg"></i> Clinic Timings
            </div>
            <div className="p-6 text-left">
              <ul className="space-y-4">
                <li className="relative pl-6"><span className="absolute left-0 top-0 font-bold text-lg" style={{ color: t.accentHex }}>•</span><strong>Office:</strong> <br /><span className="opacity-80">{doctor.personalDetails.location}</span></li>
                <li className="relative pl-6"><span className="absolute left-0 top-0 font-bold text-lg" style={{ color: t.accentHex }}>•</span><strong>Phone:</strong> <br /><span className="opacity-80">{doctor.personalDetails.phone}</span></li>
                <li className="relative pl-6"><span className="absolute left-0 top-0 font-bold text-lg" style={{ color: t.accentHex }}>•</span><strong>Email:</strong> <br /><span className="opacity-80">{doctor.personalDetails.email}</span></li>
                <li className="relative pl-6 pt-4 border-t border-current border-opacity-10"><span className="absolute left-0 top-4 font-bold text-lg" style={{ color: t.accentHex }}>•</span><strong>Work Days:</strong> <br /><span className="opacity-80">{doctor.personalDetails.workDays || 'Monday – Friday'}</span></li>
                <li className="relative pl-6"><span className="absolute left-0 top-0 font-bold text-lg" style={{ color: t.accentHex }}>•</span><strong>Visiting Hours:</strong> <br /><span className="opacity-80">{doctor.personalDetails.visitingHours || '10:00 AM - 07:00 PM'}</span></li>
              </ul>
            </div>
          </div>

          <div className={`lg:col-span-3 ${t.cardBg} ${t.borderColor} border rounded-3xl overflow-hidden shadow-lg hover:-translate-y-1 transition-all duration-300 ${t.borderHover} animate-rise`}>
            <div className={`${t.accentBg} ${t.btnText} px-6 py-4 font-bold flex items-center gap-3 uppercase tracking-wider text-sm`}>
              <i className="fas fa-comments text-lg"></i> Patient Stories
            </div>
            <div className="p-6 text-left flex flex-col gap-4">
              {testimonials.map((review, index) => (
                <div key={index} className={`${t.reviewBg} p-5 rounded-r-xl border-l-4 transition-transform hover:translate-x-2 duration-300`} style={{ borderLeftColor: t.accentHex }}>
                  <p className="italic text-base opacity-90 leading-relaxed">"{review.text}"</p>
                  <div className="mt-3 flex items-center gap-2 font-bold text-sm">
                    <i className="fas fa-user-circle text-lg" style={{ color: t.accentHex }}></i> 
                    {review.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {doctor.sliderImages && doctor.sliderImages.length > 0 && (
            <div className="lg:col-span-3 w-full py-4 animate-rise">
              <div className="text-left mb-5"><p className={`text-xs uppercase tracking-[.2em] font-bold ${t.accentText}`}>Clinic gallery</p><h2 className="text-3xl font-extrabold mt-2">A space designed for better care</h2></div>
              <GallerySlider images={doctor.sliderImages} borderClass={t.borderColor} />
            </div>
          )}

        </div>
      </section>

      <footer id="site-footer" className={`w-full ${t.cardBg} ${t.borderColor} border-t-4 py-12 px-6 z-20 relative`} style={{ borderTopColor: t.accentHex }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between gap-10">
          <div>
            <h3 className="text-xl font-bold mb-4" style={{ color: t.accentHex }}>Get in Touch</h3>
            <p className="flex items-center gap-3 mb-2 opacity-90 hover:opacity-100"><i className="fas fa-phone-alt w-5 text-center" style={{ color: t.accentHex }}></i> <a href={`tel:${doctor.personalDetails.phone}`} className="hover:underline">{doctor.personalDetails.phone}</a></p>
            <p className="flex items-center gap-3 mb-2 opacity-90 hover:opacity-100"><i className="fas fa-envelope w-5 text-center" style={{ color: t.accentHex }}></i> <a href={`mailto:${doctor.personalDetails.email}`} className="hover:underline break-all">{doctor.personalDetails.email || "Email not available"}</a></p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4" style={{ color: t.accentHex }}>Office Address</h3>
            <p className="flex items-start gap-3 mb-4 opacity-90 max-w-sm"><i className="fas fa-map-marker-alt w-5 text-center mt-1" style={{ color: t.accentHex }}></i> {doctor.personalDetails.location}</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-bold hover:underline" style={{ color: t.accentHex }}><i className="fas fa-directions"></i> View Location Map</a>
          </div>
        </div>
      </footer>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className={`w-full max-w-3xl p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] border ${t.borderColor} shadow-2xl relative max-h-[96vh] overflow-y-auto appointment-modal-scroll ${t.cardBg} ${t.text}`} style={{ animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} onClick={(e) => e.stopPropagation()}>
            
            <button className="absolute top-4 right-4 text-xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors" onClick={() => setIsModalOpen(false)}>
              <i className="fas fa-times"></i>
            </button>
            
            <h2 className="text-center text-2xl font-bold mb-6 flex items-center justify-center gap-3"><i className="fas fa-calendar-check" style={{ color: t.accentHex }}></i> Book Appointment</h2>
            
            <form onSubmit={handleAppointmentSubmit} className="grid sm:grid-cols-2 gap-4 text-left">
              
              <div>
                <label className="block mb-1.5 text-sm font-semibold opacity-90"><i className="fas fa-user mr-2" style={{ color: t.accentHex }}></i> Patient Name</label>
                <input type="text" name="patientName" minLength="2" maxLength="100" value={appointmentForm.patientName} onChange={handleAppointmentChange} required placeholder="Enter full name" className={`w-full p-3 rounded-lg border ${t.borderColor} bg-transparent focus:outline-none focus:ring-2`} style={{ focusRingColor: t.accentHex }} />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-semibold opacity-90"><i className="fas fa-mobile-alt mr-2" style={{ color: t.accentHex }}></i> Mobile Number</label>
                <input type="tel" name="phone" pattern="[+0-9 ()-]{7,20}" value={appointmentForm.phone} onChange={handleAppointmentChange} required placeholder="Enter mobile number" className={`w-full p-3 rounded-lg border ${t.borderColor} bg-transparent focus:outline-none focus:ring-2`} style={{ focusRingColor: t.accentHex }} />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-sm font-semibold opacity-90"><i className="fas fa-envelope mr-2" style={{ color: t.accentHex }}></i> Email (Optional)</label>
                <input type="email" name="email" value={appointmentForm.email} onChange={handleAppointmentChange} placeholder="Enter email address" className={`w-full p-3 rounded-lg border ${t.borderColor} bg-transparent focus:outline-none focus:ring-2`} style={{ focusRingColor: t.accentHex }} />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-sm font-semibold opacity-90"><i className="fas fa-stethoscope mr-2" style={{ color: t.accentHex }}></i> Select Treatment</label>
                <select name="treatment" value={appointmentForm.treatment} onChange={handleAppointmentChange} required className={`w-full p-3 rounded-lg border ${t.borderColor} bg-transparent focus:outline-none focus:ring-2 appearance-none`} style={{ focusRingColor: t.accentHex }}>
                  <option value="" disabled className="text-black">-- Select Treatment --</option>
                  {displayServices.map((service, index) => (
                     <option key={index} value={service} className="text-black">{service}</option>
                  ))}
                  <option value="General Consultation" className="text-black">General Consultation</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-semibold opacity-90"><i className="fas fa-calendar-day mr-2" style={{ color: t.accentHex }}></i> Preferred Date</label>
                <input type="date" name="preferredDate" value={appointmentForm.preferredDate} onChange={handleAppointmentChange} min={new Date().toISOString().split('T')[0]} required className={`w-full p-3 rounded-lg border ${t.borderColor} bg-transparent focus:outline-none focus:ring-2`} style={{ focusRingColor: t.accentHex }} />
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-semibold opacity-90">
                    <i className="fas fa-clock mr-2" style={{ color: t.accentHex }}></i> Select Time Slot
                    <span className="text-xs font-normal ml-2 opacity-70">({doctor.personalDetails.visitingHours || '10 AM - 7 PM'})</span>
                </label>
                <select name="timeSlot" value={appointmentForm.timeSlot} onChange={handleAppointmentChange} required className={`w-full p-3 rounded-lg border ${t.borderColor} bg-transparent focus:outline-none focus:ring-2 appearance-none`} style={{ focusRingColor: t.accentHex }}>
                    <option value="" disabled className="text-black">-- Select Time --</option>
                    <option value="Morning" className="text-black">Morning Slot</option>
                    <option value="Afternoon" className="text-black">Afternoon Slot</option>
                    <option value="Evening" className="text-black">Evening Slot</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1.5 text-sm font-semibold opacity-90"><i className="fas fa-comment-alt mr-2" style={{ color: t.accentHex }}></i> Additional Message</label>
                <textarea name="message" maxLength="1000" value={appointmentForm.message} onChange={handleAppointmentChange} rows="2" placeholder="Describe your problem..." className={`w-full p-3 rounded-lg border ${t.borderColor} bg-transparent focus:outline-none focus:ring-2 resize-none`} style={{ focusRingColor: t.accentHex }}></textarea>
              </div>

              {appointmentNotice.text && (
                <div className={`sm:col-span-2 p-3 rounded-lg text-sm font-semibold ${appointmentNotice.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {appointmentNotice.text}
                </div>
              )}

              <button type="submit" disabled={appointmentLoading} className={`sm:col-span-2 w-full ${t.accentBg} ${t.btnText} font-bold py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 mt-2 text-lg disabled:opacity-60`}>
                {appointmentLoading ? 'Submitting Request...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showBackToTop && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className={`fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer z-40 ${t.accentBg} ${t.btnText} hover:-translate-y-1 transition-all duration-300 text-xl animate-rise`}>
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

    </div>
  );
};

export default DoctorProfile;
