import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

const statuses = ['pending', 'confirmed', 'completed', 'cancelled'];

const AppointmentManager = ({ listUrl, statusUrl, token, title = 'Appointments', onUnauthorized, onData }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAppointments = useCallback(async () => {
    try {
      setError('');
      const res = await axios.get(listUrl, { headers: { Authorization: `Bearer ${token}` } });
      setAppointments(res.data.data || []);
      onData?.(res.data.data || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) onUnauthorized?.();
      setError(err.response?.data?.message || 'Could not load appointments.');
    } finally {
      setLoading(false);
    }
  }, [listUrl, onData, onUnauthorized, token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const updateStatus = async (appointmentId, status) => {
    try {
      const res = await axios.patch(statusUrl(appointmentId), { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(current => current.map(item => item._id === appointmentId ? res.data.data : item));
      onData?.(appointments.map(item => item._id === appointmentId ? res.data.data : item));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update appointment status.');
    }
  };

  const formatDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : '-';

  return (
    <section className="dashboard-card overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3">
        <div><p className="text-xs uppercase tracking-[.16em] font-bold text-teal-600">Patient flow</p><h3 className="text-xl font-extrabold text-slate-900 mt-1">{title}</h3></div>
        <button type="button" onClick={fetchAppointments} className="text-sm bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-teal-50 hover:text-teal-700 font-bold transition-colors"><i className="fas fa-rotate mr-2"></i>Refresh</button>
      </div>
      {error && <div className="m-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
            <tr>
              <th className="p-4">Patient</th>
              <th className="p-4">Doctor / Treatment</th>
              <th className="p-4">Preferred Schedule</th>
              <th className="p-4">Message</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {appointments.map(item => (
              <tr key={item._id} className="align-top hover:bg-teal-50/30 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-800 flex items-center gap-2"><span className="w-8 h-8 bg-teal-50 text-teal-700 rounded-full flex items-center justify-center text-xs">{item.patient?.name?.charAt(0)}</span>{item.patient?.name}</div>
                  <div className="text-slate-500">{item.patient?.phone}</div>
                  {item.patient?.email && <div className="text-slate-500">{item.patient.email}</div>}
                  <div className="text-xs text-slate-400 mt-1">Requested {formatDate(item.createdAt)}</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-slate-700">{item.doctor?.name || item.doctorSnapshot?.name}</div>
                  <div className="text-blue-600">{item.treatment}</div>
                </td>
                <td className="p-4">
                  <div className="font-semibold text-slate-700">{formatDate(item.preferredDate)}</div>
                  <div className="text-slate-500">{item.timeSlot}</div>
                </td>
                <td className="p-4 text-slate-600 max-w-xs whitespace-pre-wrap">{item.message || '-'}</td>
                <td className="p-4">
                  <select value={item.status} onChange={(e) => updateStatus(item._id, e.target.value)} className="border border-slate-200 bg-white rounded-xl px-3 py-2 capitalize focus:ring-2 focus:ring-teal-500 font-semibold text-slate-700">
                    {statuses.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!loading && appointments.length === 0 && (
              <tr><td colSpan="5" className="p-8 text-center text-slate-500">No appointment requests yet.</td></tr>
            )}
            {loading && <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading appointments...</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AppointmentManager;
