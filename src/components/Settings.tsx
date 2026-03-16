import React, { useState, useEffect } from 'react';
import { useStore, PromoData } from '../store/store';
import { MENU, fmtPrice, getVariantById } from '../constants/menu';

export function Settings() {
  const { prices, promos, fetchPricesAndPromos, setPrices, setPromos } = useStore();
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
  const [sections, setSections] = useState({ burgers: false, beverages: false, extras: false, promos: false, auth: false });
  const [promoState, setPromoState] = useState({ variantId: '', discount: 0 });
  useEffect(() => { setLocalPrices(prices); }, [prices]);

  const toggle = (sec: string) => setSections(s => ({ ...s, [sec]: !(s as any)[sec] }));

  const savePrices = async () => {
    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: localPrices })
      });
    } catch {
      console.warn('Backend unavailable, saving prices to localStorage');
      localStorage.setItem('__best_burgers_prices', JSON.stringify(localPrices));
    }
    setPrices(localPrices);
    const el = document.getElementById('global-toast');
    if (el) { el.className = 'toast visible success'; document.getElementById('global-toast-msg')!.textContent = 'Precios actualizados'; setTimeout(() => el.className='toast', 2500); }
  };

  const handlePriceChange = (id: string, val: string) => {
    setLocalPrices(prev => ({ ...prev, [id]: Number(val) || 0 }));
  };

  const togglePromo = async (vid: string) => {
    try {
      await fetch(`/api/promotions/${vid}/toggle`, { method: 'PUT' });
    } catch {
      console.warn('Backend unavailable, toggling promo in localStorage');
      setPromos({ ...promos, [vid]: { ...promos[vid], active: !promos[vid].active } });
      localStorage.setItem('__best_burgers_promos', JSON.stringify({ ...promos, [vid]: { ...promos[vid], active: !promos[vid].active } }));
    }
    fetchPricesAndPromos();
  };
  
  const deletePromo = async (vid: string) => {
    try {
      await fetch(`/api/promotions/${vid}`, { method: 'DELETE' });
    } catch {
      console.warn('Backend unavailable, deleting promo from localStorage');
      const newPromos = { ...promos };
      delete newPromos[vid];
      setPromos(newPromos);
      localStorage.setItem('__best_burgers_promos', JSON.stringify(newPromos));
    }
    fetchPricesAndPromos();
  };

  const savePromo = async () => {
    if (!promoState.variantId || promoState.discount <= 0) return;
    try {
      await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: promoState.variantId, discount: promoState.discount, active: true })
      });
    } catch {
      console.warn('Backend unavailable, saving promo to localStorage');
      const newPromos = { ...promos, [promoState.variantId]: { variantId: promoState.variantId, discount: promoState.discount, active: true } };
      setPromos(newPromos);
      localStorage.setItem('__best_burgers_promos', JSON.stringify(newPromos));
    }
    setPromoState({ variantId: '', discount: 0 });
    fetchPricesAndPromos();
  };


  const allBurgerVariants = MENU.burgers.flatMap(b => b.variants.map(v => ({ p: b.name, v: v.name, id: v.id })));

  return (
    <div className="settings-scroll">
      <div className="settings-top-bar">
        <h2 className="settings-title">Configuración de Precios</h2>
        <button className="btn primary" onClick={savePrices}>Guardar todos los cambios</button>
      </div>

      <div className="settings-section">
        <div className="settings-section-header" onClick={() => toggle('burgers')}>
          <span>Hamburguesas</span><span className={`section-chevron ${!sections.burgers ? 'collapsed' : ''}`}>▲</span>
        </div>
        <div className={`price-table ${!sections.burgers ? 'collapsed' : ''}`}>
          {MENU.burgers.flatMap(b => b.variants.map(v => (
            <div key={v.id} className="price-row">
              <div className="price-name">{b.name} — {v.name}</div>
              <input className="price-input" type="number" value={localPrices[v.id] ?? ''} onChange={e => handlePriceChange(v.id, e.target.value)} step="100"/>
            </div>
          )))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header" onClick={() => toggle('beverages')}>
          <span>Bebidas</span><span className={`section-chevron ${!sections.beverages ? 'collapsed' : ''}`}>▲</span>
        </div>
        <div className={`price-table ${!sections.beverages ? 'collapsed' : ''}`}>
          {MENU.beverages.flatMap(b => b.variants.map(v => (
            <div key={v.id} className="price-row">
              <div className="price-name">{b.name} — {v.name}</div>
              <input className="price-input" type="number" value={localPrices[v.id] ?? ''} onChange={e => handlePriceChange(v.id, e.target.value)} step="100"/>
            </div>
          )))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header" onClick={() => toggle('extras')}>
          <span>Extras</span><span className={`section-chevron ${!sections.extras ? 'collapsed' : ''}`}>▲</span>
        </div>
        <div className={`price-table ${!sections.extras ? 'collapsed' : ''}`}>
          {MENU.extras.map(e => (
            <div key={e.id} className="price-row">
              <div className="price-name">{e.name}</div>
              <input className="price-input" type="number" value={localPrices[e.id] ?? ''} onChange={ev => handlePriceChange(e.id, ev.target.value)} step="100"/>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-header" onClick={() => toggle('promos')}>
          <span>Promociones</span><span className={`section-chevron ${!sections.promos ? 'collapsed' : ''}`}>▲</span>
        </div>
        <div className={`price-table ${!sections.promos ? 'collapsed' : ''}`} style={{ maxHeight: '320px' }}>
          <div>
            {Object.values(promos).map((p: PromoData) => {
              const f = getVariantById(p.variantId);
              if (!f) return null;
              const normp = prices[p.variantId] || 0;
              const finalp = Math.max(0, normp - p.discount);
              return (
                <div key={p.variantId} className="price-row" style={{ alignItems: 'center', opacity: p.active ? 1 : 0.5 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{f.product.name} {f.variant.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{fmtPrice(normp)} − {fmtPrice(p.discount)} = <span style={{ color: 'var(--success)' }}>{fmtPrice(finalp)}</span></div>
                  </div>
                  <span className={`status-badge ${p.active ? 'completed' : 'pending'}`}>{p.active ? 'Activa' : 'Pausada'}</span>
                  <button className="btn sm" onClick={() => togglePromo(p.variantId)}>{p.active ? '⏸' : '▶'}</button>
                  <button className="btn sm danger" onClick={() => deletePromo(p.variantId)}>✕</button>
                </div>
              );
            })}
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>NUEVA PROMOCIÓN</div>
            <div className="form-field">
              <select className="form-input" value={promoState.variantId} onChange={e => setPromoState(p => ({ ...p, variantId: e.target.value }))}>
                <option value="">— Seleccioná producto —</option>
                {allBurgerVariants.map(v => <option key={v.id} value={v.id}>{v.p} — {v.v}</option>)}
              </select>
            </div>
            {promoState.variantId && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input className="form-input" type="number" value={promoState.discount} onChange={e => setPromoState(p => ({ ...p, discount: Number(e.target.value) }))} />
                <button className="btn primary" onClick={savePromo}>Agregar Promo</button>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
