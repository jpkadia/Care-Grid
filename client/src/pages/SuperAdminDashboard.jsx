import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppointmentManager from '../components/AppointmentManager';
import AdminChatbot from '../components/AdminChatbot';
import DashboardAnalytics from '../components/DashboardAnalytics';
import ThemeToggle from '../components/ThemeToggle';
import { useUi } from '../components/UiProvider';
import { clearSessionToken, getSessionToken } from '../utils/auth';
import FileUpload from '../components/FileUpload';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { toast, confirm } = useUi();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDoctor, setEditingDoctor] = useState(null);
  
  const [editData, setEditData] = useState({});
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [sliderImages, setSliderImages] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);

  const fetchDoctors = useCallback(async () => {
    try {
      const token = getSessionToken('superAdminToken');
      if (!token) {
        navigate('/superadmin');
        return;
      }
      const res = await axios.get('/api/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDoctors(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearSessionToken('superAdminToken');
        navigate('/superadmin');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleLogout = useCallback(() => {
    clearSessionToken('superAdminToken');
    navigate('/superadmin');
  }, [navigate]);

  const handleDelete = async (id, name) => {
    if (await confirm({ title: `Delete Dr. ${name}?`, message: 'This permanently removes the doctor portal, appointments, and uploaded photos.', confirmText: 'Delete portal' })) {
      try {
        const token = getSessionToken('superAdminToken');
        await axios.delete(`/api/admin/doctors/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDoctors(doctors.filter(d => d._id !== id));
      } catch {
        toast("Failed to delete doctor.", 'error');
      }
    }
  };

  const openEditModal = (d) => {
    setEditingDoctor(d);
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
      services: d.aiContent?.services ? d.aiContent.services.join(', ') : '',
      // YE DO LINES ADD KARNI HAIN 👇
      photoUrl: d.photoUrl || '', 
      existingSliderImages: d.sliderImages ? JSON.stringify(d.sliderImages) : '[]'
    });
    setProfilePhoto(null);
    setSliderImages([]);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleProfilePhoto = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) return toast('Profile photo must be smaller than 5MB.', 'error');
    setProfilePhoto(file);
  };

  const handleSliderImages = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 8) return toast('You can upload a maximum of 8 clinic photos.', 'error');
    if (files.some(file => file.size > 5 * 1024 * 1024)) return toast('Each clinic photo must be smaller than 5MB.', 'error');
    setSliderImages(files);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const token = getSessionToken('superAdminToken');
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

      const res = await axios.put(`/api/admin/doctors/${editingDoctor._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000
      });

      if (res.data.success) {
        toast("Doctor updated successfully.");
        setEditingDoctor(null);
        fetchDoctors();
      }
    } catch (err) {
      toast(err.response?.data?.message || "Failed to update doctor. Please check your connection and try again.", 'error');
      if (err.response?.status === 401 || err.response?.status === 403) handleLogout();
    } finally {
      setUpdateLoading(false);
    }
  };

  const inputClass = "field-modern text-sm";

  if (loading) return <div className="min-h-screen flex items-center justify-center app-shell text-teal-700 text-xl font-bold"><i className="fas fa-circle-notch animate-spin mr-3"></i>Initializing network...</div>;

  return (
    <div className="min-h-screen app-shell">
      <header className="bg-slate-950/95 backdrop-blur-xl text-white px-4 sm:px-8 py-4 shadow-xl flex justify-between items-center sticky top-0 z-40 border-b border-white/5">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center"><i className="fas fa-heart-pulse"></i></div><div><h1 className="text-base sm:text-lg font-extrabold">CareGrid Network</h1><p className="text-[10px] uppercase tracking-widest text-teal-300">Super admin command center</p></div></div>
        <div className="flex gap-3 items-center">
            <ThemeToggle />
            <span className="hidden sm:inline text-xs font-bold bg-white/10 px-4 py-2 rounded-xl border border-white/10">{doctors.length} Active Portals</span>
            <button onClick={handleLogout} className="bg-red-500/10 text-red-300 hover:bg-red-500/20 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"><i className="fas fa-power-off sm:mr-2"></i><span className="hidden sm:inline">Logout</span></button>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 animate-rise"><div><p className="text-xs uppercase tracking-[.2em] font-bold text-teal-600">Network intelligence</p><h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-2">Healthcare operations</h2><p className="text-slate-500 mt-2">Monitor every portal and patient request from one place.</p></div><span className="text-xs font-semibold bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-500">Live network overview</span></div>
        <DashboardAnalytics appointments={appointments} doctors={doctors} scope="super" />
        <AppointmentManager
          listUrl="/api/admin/appointments"
          statusUrl={(id) => `/api/admin/appointments/${id}/status`}
          token={getSessionToken('superAdminToken')}
          title="All Patient Appointment Requests"
          onUnauthorized={handleLogout}
          onData={setAppointments}
        />
        <div className="dashboard-card overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100"><p className="text-xs uppercase tracking-[.16em] font-bold text-teal-600">Portal directory</p><h3 className="text-xl font-extrabold text-slate-900 mt-1">Doctor network</h3></div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-100">
                            <th className="p-4">Profile</th>
                            <th className="p-4">Doctor Details</th>
                            <th className="p-4">Clinic Info</th>
                            <th className="p-4">URL Slug</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {doctors.map(doc => (
                            <tr key={doc._id} className="hover:bg-teal-50/30 transition-colors">
                                <td className="p-4">
                                    <img src={doc.photoUrl || "https://via.placeholder.com/150"} alt={doc.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md" />
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{doc.name}</div>
                                    <div className="text-xs text-slate-500 mt-1">{doc.personalDetails?.speciality}</div>
                                    <div className="text-xs text-slate-500">{doc.personalDetails?.email}</div>
                                </td>
                                <td className="p-4">
                                    <div className="font-semibold text-slate-700 text-sm">{doc.personalDetails?.clinicName}</div>
                                    <div className="text-xs text-slate-500 mt-1"><i className="fas fa-map-marker-alt"></i> {doc.personalDetails?.location}</div>
                                    <div className="text-xs text-slate-500"><i className="fas fa-phone"></i> {doc.personalDetails?.phone}</div>
                                </td>
                                <td className="p-4">
                                    <a href={`/doctor/${doc.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline text-sm flex items-center gap-1">
                                        /{doc.slug} <i className="fas fa-external-link-alt text-xs"></i>
                                    </a>
                                    <div className="mt-2 text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-teal-50 text-teal-700 inline-block rounded-lg">{doc.theme === 'gold-dark' ? 'Gold Signature' : doc.theme}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => openEditModal(doc)} className="bg-amber-50 hover:bg-amber-100 text-amber-700 w-9 h-9 rounded-xl flex items-center justify-center transition-colors" title="Edit Doctor">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button onClick={() => handleDelete(doc._id, doc.name)} className="bg-red-50 hover:bg-red-100 text-red-600 w-9 h-9 rounded-xl flex items-center justify-center transition-colors" title="Delete Doctor">
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {doctors.length === 0 && (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-semibold">No doctors found in the database.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </main>

      {editingDoctor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-rise">
            <div className="bg-gradient-to-r from-slate-950 to-teal-950 px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center gap-3 text-white rounded-t-3xl">
                <h2 className="font-bold text-sm sm:text-lg truncate"><i className="fas fa-user-edit text-blue-400 mr-2"></i> Master Edit: {editingDoctor.name}</h2>
                <button onClick={() => setEditingDoctor(null)} className="text-slate-300 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <div className="overflow-y-auto p-4 sm:p-6">
                <form id="superAdminEditForm" onSubmit={handleUpdateSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Doctor Name</label><input type="text" name="name" value={editData.name} onChange={handleEditChange} className={inputClass} required /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Qualification</label><input type="text" name="education" value={editData.education} onChange={handleEditChange} className={inputClass} required /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Speciality</label><input type="text" name="speciality" value={editData.speciality} onChange={handleEditChange} className={inputClass} required /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Clinic Name</label><input type="text" name="clinicName" value={editData.clinicName} onChange={handleEditChange} className={inputClass} required /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label><input type="tel" name="phone" inputMode="numeric" pattern="\d{10}" minLength="10" maxLength="10" title="Enter exactly 10 digits" value={editData.phone} onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); handleEditChange(e); }} className={inputClass} required /></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label><input type="email" name="email" value={editData.email} onChange={handleEditChange} className={inputClass} required /></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Clinic Address</label><textarea name="location" value={editData.location} onChange={handleEditChange} rows="2" className={inputClass} required></textarea></div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1"><label className="block text-xs font-bold text-slate-600 mb-1">Work Days</label><input type="text" name="workDays" value={editData.workDays} onChange={handleEditChange} className={inputClass} required /></div>
                            <div className="flex-1"><label className="block text-xs font-bold text-slate-600 mb-1">Visiting Hours</label><input type="text" name="visitingHours" value={editData.visitingHours} onChange={handleEditChange} className={inputClass} required /></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Theme Configuration</label><select name="theme" value={editData.theme} onChange={handleEditChange} className={inputClass}><option value="gold-dark">Gold Signature</option><option value="classic-blue">Classic Blue</option><option value="nature-green">Nature Green</option></select></div>
                        <div><label className="block text-xs font-bold text-slate-600 mb-1">Tagline</label><input type="text" name="tagline" value={editData.tagline} onChange={handleEditChange} className={inputClass} required /></div>
                    </div>

                    <div><label className="block text-xs font-bold text-slate-600 mb-1">About Section (Bio)</label><textarea name="about" value={editData.about} onChange={handleEditChange} rows="3" className={inputClass} required></textarea></div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-1">Homepage Hero Headline</label><input type="text" name="heroHeadline" maxLength="80" value={editData.heroHeadline || ''} onChange={handleEditChange} className={inputClass} required /></div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-1">Treatments / Services</label><textarea name="services" value={editData.services} onChange={handleEditChange} rows="2" className={inputClass} required></textarea></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-100 p-4 rounded-lg border border-slate-200">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">Force Replace Profile Photo</label>
                            <FileUpload label="Replace profile photo" hint="JPG, PNG or WebP, maximum 5MB" compact onChange={handleProfilePhoto} onDiscard={() => setProfilePhoto(null)} files={profilePhoto} icon="fa-user-doctor" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">Force Replace Clinic Photos</label>
                            <FileUpload label="Replace clinic gallery" hint="Up to 8 images, maximum 5MB each" multiple onChange={handleSliderImages} onDiscard={(index) => setSliderImages(current => current.filter((_, itemIndex) => itemIndex !== index))} files={sliderImages} icon="fa-images" />
                        </div>
                    </div>
                </form>
            </div>
            
            <div className="bg-slate-50 border-t border-slate-100 px-4 sm:px-6 py-4 rounded-b-3xl flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button type="button" onClick={() => setEditingDoctor(null)} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors">Cancel</button>
                <button type="submit" form="superAdminEditForm" disabled={updateLoading} className="btn-primary px-5 py-2.5 flex items-center gap-2">
                    {updateLoading ? 'Overriding...' : <><i className="fas fa-check"></i> Master Save</>}
                </button>
            </div>
          </div>
        </div>
      )}
      <AdminChatbot
        endpoint="/api/admin/chat"
        historyEndpoint="/api/admin/chat/history"
        token={getSessionToken('superAdminToken')}
        title="Super Admin Assistant"
      />
    </div>
  );
};

export default SuperAdminDashboard;
