import React, { useEffect, useState } from 'react';

const ThemeToggle = ({ floating = false, value, onChange }) => {
  const [internalDark, setInternalDark] = useState(() => localStorage.getItem('caregridColorMode') === 'dark');
  const dark = value ?? internalDark;

  useEffect(() => {
    if (value !== undefined) return;
    document.documentElement.classList.toggle('dark', internalDark);
    localStorage.setItem('caregridColorMode', internalDark ? 'dark' : 'light');
  }, [internalDark, value]);

  const toggle = () => {
    const next = !dark;
    if (onChange) onChange(next);
    else setInternalDark(next);
  };

  return (
    <button type="button" onClick={toggle} className={`${floating ? 'fixed bottom-6 left-6 z-40 shadow-2xl' : ''} w-11 h-11 rounded-xl bg-white/10 border border-white/10 text-current flex items-center justify-center hover:scale-105 transition-transform`} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <i className={`fas ${dark ? 'fa-sun' : 'fa-moon'}`}></i>
    </button>
  );
};

export default ThemeToggle;
