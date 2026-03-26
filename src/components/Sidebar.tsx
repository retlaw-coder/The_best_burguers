import React from 'react';
import logoUrl from '../assets/logo.svg';

interface SidebarProps {
  collapsed: boolean;
  toggleSidebar: () => void;
  setView: (view: string) => void;
  currentView: string;
  addrType: 'street' | 'diag';
  setAddrType: (type: 'street' | 'diag') => void;
  streetNum: string;
  setStreetNum: (num: string) => void;
  doorNum: string;
  setDoorNum: (num: string) => void;
  addrResult: { text: string; error: boolean; empty: boolean };
}

export function Sidebar({ collapsed, toggleSidebar, setView, currentView, addrType, setAddrType, streetNum, setStreetNum, doorNum, setDoorNum, addrResult }: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} id="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon" onClick={toggleSidebar} style={{ background: 'transparent', padding: 0 }}>
          <img src={logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div className="logo-text" style={{ textAlign: 'left', textTransform: 'uppercase', lineHeight: 1.1, fontSize: '14px', marginTop: '2px' }}>
          the<br />best<br />burguer
        </div>
      </div>
      <nav className="nav">
        <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
          <span className="nav-icon">⊞</span>
          <span className="nav-label">Panel</span>
        </div>
        <div className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>
          <span className="nav-icon">⊛</span>
          <span className="nav-label">Precios</span>
        </div>
        <div className={`nav-item ${currentView === 'caja' ? 'active' : ''}`} onClick={() => setView('caja')}>
          <span className="nav-icon">⊠</span>
          <span className="nav-label">Caja</span>
        </div>
      </nav>

      <div className="addr-calc">
        <div className="addr-calc-label">📍 Entre calles</div>
        <div className="addr-toggle">
          <div className={`addr-toggle-opt ${addrType === 'street' ? 'active' : ''}`} onClick={() => setAddrType('street')}>Calle / Av.</div>
          <div className={`addr-toggle-opt ${addrType === 'diag' ? 'active' : ''}`} onClick={() => setAddrType('diag')}>Diagonal</div>
        </div>
        <div className="addr-inputs">
          <div className="addr-input-wrap">
            <div className="addr-input-lbl">N° vía</div>
            <input className="addr-input" type="number" placeholder={addrType === 'diag' ? '73' : '14'} min="1" value={streetNum} onChange={e => setStreetNum(e.target.value)} />
          </div>
          <div className="addr-input-wrap">
            <div className="addr-input-lbl">N° puerta</div>
            <input className="addr-input" type="number" placeholder="445" min="0" value={doorNum} onChange={e => setDoorNum(e.target.value)} />
          </div>
        </div>
        <div className={`addr-result ${addrResult.error ? 'error' : addrResult.empty ? 'empty' : ''}`}>{addrResult.text}</div>
      </div>
    </aside>
  );
}
