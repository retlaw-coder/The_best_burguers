import React, { useState, useEffect } from 'react';

export function Header() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="header">
      <span className="header-title">THE BEST BURGERS</span>
      <span className="header-badge">POS v1.0</span>
      <div className="header-right">
        <span className="header-time">{time}</span>
      </div>
    </header>
  );
}
