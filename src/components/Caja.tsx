import React, { useState } from 'react';
import { useStore, OrderData } from '../store/store';
import { fmtPrice } from '../constants/menu';

export function Caja() {
  const { cajaUnlocked, setCajaUnlocked, orders } = useStore();
  const [pinBuffer, setPinBuffer] = useState('');
  const [pinError, setPinError] = useState('');
  const [period, setPeriod] = useState<'day'|'week'|'month'>('day');

  const handleInput = async (d: string) => {
    if (pinBuffer.length >= 4) return;
    const newPin = pinBuffer + d;
    setPinBuffer(newPin);
    if (newPin.length === 4) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: newPin })
        });
        const data = await res.json();
        if (data.success) {
          setCajaUnlocked(true);
        } else {
          setPinError('PIN incorrecto');
          setTimeout(() => setPinError(''), 1500);
        }
      } catch {
        console.warn('Backend unavailable, checking PIN locally');
        const savedPin = localStorage.getItem('__best_burgers_pin') || '1234';
        if (newPin === savedPin) {
          setCajaUnlocked(true);
        } else {
          setPinError('PIN incorrecto (Local)');
          setTimeout(() => setPinError(''), 1500);
        }
      }
      setPinBuffer('');
    }
  };

  if (!cajaUnlocked) {
    return (
      <div className="pin-overlay" style={{ display: 'flex' }}>
        <div className="pin-title">🔒 ACCESO CAJA</div>
        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => <div key={i} className={`pin-dot ${i < pinBuffer.length ? 'filled' : ''}`} />)}
        </div>
        <div className="pin-error">{pinError}</div>
        <div className="numpad">
          {['1','2','3','4','5','6','7','8','9','del','0','ok'].map(n => {
            if (n === 'del') return <button key={n} className="numpad-btn del" onClick={() => setPinBuffer(pinBuffer.slice(0, -1))}>⌫</button>;
            if (n === 'ok') return <button key={n} className="numpad-btn accent">✓</button>;
            return <button key={n} className="numpad-btn" onClick={() => handleInput(n)}>{n}</button>;
          })}
        </div>
      </div>
    );
  }

  const now = new Date();
  let filtered = orders;
  if (period === 'day') {
    filtered = orders.filter(o => new Date(o.createdAt).toDateString() === now.toDateString());
  } else if (period === 'week') {
    const w = new Date(now); w.setDate(now.getDate() - 7);
    filtered = orders.filter(o => new Date(o.createdAt) >= w);
  } else {
    const m = new Date(now); m.setMonth(now.getMonth() - 1);
    filtered = orders.filter(o => new Date(o.createdAt) >= m);
  }

  const rev = filtered.reduce((s, o) => s + o.total, 0);
  const avg = filtered.length > 0 ? Math.round(rev / filtered.length) : 0;
  const cash = filtered.filter(o => o.payment === 'CASH').length;
  const trans = filtered.filter(o => o.payment === 'TRANSFER').length;

  return (
    <div className="caja-content visible">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ fontFamily: '"Arial Black", Impact, sans-serif', fontSize: '24px', letterSpacing: '1px', color: 'var(--accent)' }}>Módulo Caja</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="period-tabs">
            <div className={`tab ${period === 'day' ? 'active' : ''}`} onClick={() => setPeriod('day')}>Hoy</div>
            <div className={`tab ${period === 'week' ? 'active' : ''}`} onClick={() => setPeriod('week')}>Semana</div>
            <div className={`tab ${period === 'month' ? 'active' : ''}`} onClick={() => setPeriod('month')}>Mes</div>
          </div>
          <button className="btn sm danger" onClick={() => setCajaUnlocked(false)}>Bloquear</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card accent">
          <div className="kpi-label">Ingreso Bruto</div>
          <div className="kpi-value">{fmtPrice(rev)}</div>
          <div className="kpi-sub">{period === 'day' ? 'Hoy' : period === 'week' ? '7 días' : 'Último mes'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Pedidos</div>
          <div className="kpi-value">{filtered.length}</div>
          <div className="kpi-sub">Completados + en curso</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ticket Promedio</div>
          <div className="kpi-value">{fmtPrice(avg)}</div>
          <div className="kpi-sub">Por pedido</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Efectivo / Transfer.</div>
          <div className="kpi-value">{cash} / {trans}</div>
          <div className="kpi-sub">Métodos de pago</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header">Detalle de Pedidos</div>
        <div style={{ overflowX: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>Sin pedidos en el período</div>
          ) : (
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Ticket</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Cliente</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Estado</th>
                  <th style={{ padding: '8px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>Pago</th>
                  <th style={{ padding: '8px 16px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: 500 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 16px', fontFamily: 'Consolas,monospace', color: 'var(--text-primary)' }}>#{o.ticketId}</td>
                    <td style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>{o.name || '—'}</td>
                    <td style={{ padding: '8px 16px' }}><span className={`status-badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
                    <td style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>{o.payment === 'CASH' ? 'Efectivo' : 'Transferencia'}</td>
                    <td style={{ padding: '8px 16px', textAlign: 'right', fontFamily: 'Consolas,monospace', color: 'var(--accent)' }}>{fmtPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
