import React from 'react';

const statusMeta = {
  pending: { color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700', icon: 'fa-hourglass-half' },
  confirmed: { color: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-700', icon: 'fa-calendar-check' },
  completed: { color: '#10b981', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'fa-circle-check' },
  cancelled: { color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700', icon: 'fa-ban' }
};

const MetricCard = ({ label, value, note, icon, tone }) => (
  <div className="dashboard-card p-5 relative overflow-hidden group">
    <div className={`absolute -right-6 -top-8 w-24 h-24 rounded-full opacity-50 ${tone}`}></div>
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-xs uppercase tracking-[.16em] font-bold text-slate-400">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 mt-2">{value}</p>
        <p className="text-xs text-slate-500 mt-2">{note}</p>
      </div>
      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform">
        <i className={`fas ${icon}`}></i>
      </div>
    </div>
  </div>
);

const DashboardAnalytics = ({ appointments = [], doctors = [], scope = 'doctor' }) => {
  const counts = Object.keys(statusMeta).reduce((result, status) => {
    result[status] = appointments.filter(item => item.status === status).length;
    return result;
  }, {});
  const total = appointments.length;
  const completion = total ? Math.round((counts.completed / total) * 100) : 0;
  const upcoming = appointments.filter(item => new Date(item.preferredDate) >= new Date() && item.status !== 'cancelled').length;

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const value = appointments.filter(item => new Date(item.createdAt).toDateString() === date.toDateString()).length;
    return { label: date.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2), value };
  });
  const max = Math.max(...days.map(day => day.value), 1);
  let offset = 0;

  return (
    <section className="space-y-6 animate-rise">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Appointments" value={total} note="Total patient requests" icon="fa-calendar-days" tone="bg-teal-100" />
        <MetricCard label="Upcoming" value={upcoming} note="Active future visits" icon="fa-user-clock" tone="bg-sky-100" />
        <MetricCard label="Completion" value={`${completion}%`} note="Care workflow closed" icon="fa-chart-line" tone="bg-violet-100" />
        <MetricCard label={scope === 'super' ? 'Doctor Portals' : 'Services'} value={scope === 'super' ? doctors.length : '-'} note={scope === 'super' ? 'Managed healthcare sites' : 'Profile performance'} icon={scope === 'super' ? 'fa-user-doctor' : 'fa-stethoscope'} tone="bg-amber-100" />
      </div>

      <div className="grid xl:grid-cols-[1.45fr_.8fr] gap-6">
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-7">
            <div><p className="text-xs uppercase tracking-[.16em] font-bold text-teal-600">Activity</p><h3 className="text-xl font-extrabold text-slate-900 mt-1">Appointment requests</h3></div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">Last 7 days</span>
          </div>
          <div className="h-52 flex items-end gap-3 sm:gap-5">
            {days.map(day => (
              <div key={day.label} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group">
                <span className="text-xs font-bold text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity">{day.value}</span>
                <div className="w-full max-w-12 rounded-t-xl bg-gradient-to-t from-teal-600 to-emerald-300 transition-all duration-500 group-hover:brightness-110" style={{ height: `${Math.max(8, (day.value / max) * 82)}%` }}></div>
                <span className="text-xs font-semibold text-slate-400">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card p-6">
          <p className="text-xs uppercase tracking-[.16em] font-bold text-teal-600">Care pipeline</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1 mb-6">Status overview</h3>
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40 rounded-full" style={{ background: total ? `conic-gradient(${Object.entries(statusMeta).map(([status, meta]) => { const start = offset; offset += (counts[status] / total) * 100; return `${meta.color} ${start}% ${offset}%`; }).join(',')})` : '#e2e8f0' }}>
              <div className="absolute inset-5 bg-white rounded-full flex flex-col items-center justify-center"><strong className="text-3xl text-slate-900">{total}</strong><span className="text-xs text-slate-400">requests</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(statusMeta).map(([status, meta]) => <div key={status} className={`${meta.bg} ${meta.text} rounded-xl px-3 py-2 flex justify-between text-xs font-bold capitalize`}><span>{status}</span><span>{counts[status]}</span></div>)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardAnalytics;
