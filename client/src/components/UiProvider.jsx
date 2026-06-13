/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState } from 'react';

const UiContext = createContext(null);

export const UiProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);

  const toast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(current => [...current, { id, message, type }]);
    setTimeout(() => setToasts(current => current.filter(item => item.id !== id)), 4500);
  }, []);

  const confirm = useCallback((options) => new Promise(resolve => {
    setDialog({ ...options, resolve });
  }), []);

  const closeDialog = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed top-5 right-5 z-[100] space-y-3 w-[calc(100%-2.5rem)] max-w-sm">
        {toasts.map(item => (
          <div key={item.id} className={`animate-rise rounded-2xl border p-4 shadow-2xl flex gap-3 bg-white ${item.type === 'error' ? 'border-red-200 text-red-700' : 'border-emerald-200 text-emerald-800'}`}>
            <i className={`fas ${item.type === 'error' ? 'fa-circle-exclamation text-red-500' : 'fa-circle-check text-emerald-500'} mt-0.5`}></i>
            <p className="text-sm font-semibold">{item.message}</p>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="fixed inset-0 z-[110] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md dashboard-card p-7 animate-rise">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-triangle-exclamation"></i></div>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-5">{dialog.title || 'Please confirm'}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mt-3">{dialog.message}</p>
            <div className="flex justify-end gap-3 mt-7">
              <button onClick={() => closeDialog(false)} className="px-5 py-3 rounded-xl border border-slate-200 font-bold text-slate-600">Cancel</button>
              <button onClick={() => closeDialog(true)} className="px-5 py-3 rounded-xl bg-red-600 text-white font-bold">{dialog.confirmText || 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </UiContext.Provider>
  );
};

export const useUi = () => useContext(UiContext);
