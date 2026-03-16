import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OrderTaking } from './components/OrderTaking';
import { ActiveOrders } from './components/ActiveOrders';
import { Settings } from './components/Settings';
import { Caja } from './components/Caja';
import { useStore } from './store/store';

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setView] = useState('dashboard'); // dashboard | settings | caja
  
  // Address calc state
  const [addrType, setAddrType] = useState<'street' | 'diag'>('street');
  const [streetNum, setStreetNum] = useState('');
  const [doorNum, setDoorNum] = useState('');
  const [addrResult, setAddrResult] = useState({ text: 'Ingresá calle y puerta', error: false, empty: true });

  const { fetchPricesAndPromos, fetchOrders } = useStore();

  useEffect(() => {
    fetchPricesAndPromos();
    fetchOrders();
  }, []);

  // Address Calculation logic (La Plata)
  useEffect(() => {
    const s = parseInt(streetNum, 10);
    const d = parseInt(doorNum, 10);
    if (!streetNum || !doorNum) {
      setAddrResult({ text: 'Ingresá calle y puerta', error: false, empty: true });
      return;
    }
    if (isNaN(s) || isNaN(d) || d < 0 || s < 1) {
      setAddrResult({ text: '⚠ Ingresá número de puerta válido', error: true, empty: false });
      return;
    }
    const base = Math.floor(d / 100);
    let c1, c2;
    if (addrType === 'diag') {
      let calleR;
      if ([73, 74, 79, 80].includes(s)) calleR = base - 5;
      else if ([75, 76].includes(s)) calleR = base + 14;
      else if ([77, 78].includes(s)) calleR = base + 1;
      else { setAddrResult({ text: '⚠ Diagonal no reconocida (73-80)', error: true, empty: false }); return; }
      c1 = calleR; c2 = calleR + 1;
    } else {
      const g1 = (s >= 1 && s <= 31) || (s >= 115 && s <= 122);
      const g2 = s >= 32 && s <= 90;
      if (g1) {
        let calleR = (base * 2) + 32;
        if (calleR > 52) calleR = (base * 2) + 33;
        c1 = calleR; c2 = calleR + 1;
      } else if (g2) {
        c1 = (base * 2) - 5; c2 = c1 + 1;
      } else {
        setAddrResult({ text: '⚠ Calle fuera de rango (1-90, 115-122)', error: true, empty: false }); return;
      }
    }
    if (c1 < 1 || c2 < 1) {
      setAddrResult({ text: '⚠ Ingresá número de puerta válido', error: true, empty: false }); return;
    }
    setAddrResult({ text: `📍 Entre ${c1} y ${c2}`, error: false, empty: false });
  }, [streetNum, doorNum, addrType]);

  return (
    <div className="app">
      <Sidebar 
        collapsed={collapsed} toggleSidebar={() => setCollapsed(!collapsed)}
        setView={setView} currentView={currentView}
        addrType={addrType} setAddrType={setAddrType}
        streetNum={streetNum} setStreetNum={setStreetNum}
        doorNum={doorNum} setDoorNum={setDoorNum}
        addrResult={addrResult}
      />
      <div className="main">
        <Header />
        <div className="content">
          <div className={`view ${currentView === 'dashboard' ? 'active' : ''}`} id="view-dashboard" style={{ display: currentView === 'dashboard' ? 'flex' : 'none' }}>
            <OrderTaking />
            <ActiveOrders />
          </div>
          <div className={`view ${currentView === 'settings' ? 'active' : ''}`} id="view-settings" style={{ display: currentView === 'settings' ? 'flex' : 'none' }}>
            <Settings />
          </div>
          <div className={`view ${currentView === 'caja' ? 'active' : ''}`} id="view-caja" style={{ display: currentView === 'caja' ? 'flex' : 'none' }}>
            <Caja />
          </div>
        </div>
      </div>
      <div className="toast" id="global-toast">
        <span id="global-toast-icon">✓</span>
        <span id="global-toast-msg"></span>
      </div>
    </div>
  );
}

export default App;
