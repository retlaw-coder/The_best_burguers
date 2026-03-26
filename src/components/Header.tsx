import React, { useState, useEffect } from 'react';

export function Header() {
  const [time, setTime] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('__best_burgers_theme') !== 'light';
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('__best_burgers_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Apply saved theme on first load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, []);

  return (
    <header className="header">
      <span className="header-title">THE BEST BURGER</span>
      <span className="header-badge">POS v2.0</span>
      <div className="header-right">
        <span className="header-time">{time}</span>
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Cambiar tema"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
