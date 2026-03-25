import React, { useState, useEffect } from 'react';
import { useStore, PromoData } from '../store/store';
import { MENU, fmtPrice, getVariantById } from '../constants/menu';
import { PriceInput } from './PriceInput';

export function Settings() {
  const { prices, promos, fetchPricesAndPromos, setPrices, setPromos, menuBurgers, menuBeverages, menuExtras, addBurger, removeBurger, addBeverage, removeBeverage, addExtra, removeExtra } = useStore();
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
  const [promoState, setPromoState] = useState({ variantId: '', discount: 0 });

  // CRUD forms
  const [showAddBurger, setShowAddBurger] = useState(false);
  const [burgerForm, setBurgerForm] = useState({ name: '', desc: '', priceS: 0, priceD: 0, priceT: 0 });
  const [showAddBeverage, setShowAddBeverage] = useState(false);
  const [beverageForm, setBeverageForm] = useState({ name: '', price: 0 });
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [extraForm, setExtraForm] = useState({ name: '', price: 0 });

  // Delete confirmations
  const [confirmDeleteBurger, setConfirmDeleteBurger] = useState<string | null>(null);
  const [confirmDeleteBeverage, setConfirmDeleteBeverage] = useState<string | null>(null);
  const [confirmDeleteExtra, setConfirmDeleteExtra] = useState<string | null>(null);

  useEffect(() => { setLocalPrices(prices); }, [prices]);

  const showToast = (success: boolean, msg: string) => {
    const el = document.getElementById('global-toast');
    if (el) {
      el.className = `toast visible ${success ? 'success' : 'warning'}`;
      document.getElementById('global-toast-msg')!.textContent = msg;
      setTimeout(() => el.className = 'toast', 2500);
    }
  };

  const savePrices = async () => {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices: localPrices })
      });
      if (!res.ok) throw new Error();
    } catch {
      localStorage.setItem('__best_burgers_prices', JSON.stringify(localPrices));
    }
    setPrices(localPrices);
    showToast(true, 'Precios actualizados');
  };

  const handlePriceChange = (id: string, val: string) => {
    setLocalPrices(prev => ({ ...prev, [id]: Number(val) || 0 }));
  };

  const togglePromo = async (vid: string) => {
    try {
      const res = await fetch(`/api/promotions/${vid}/toggle`, { method: 'PUT' });
      if (!res.ok) throw new Error();
    } catch {
      const updated = { ...promos, [vid]: { ...promos[vid], active: !promos[vid].active } };
      setPromos(updated);
      localStorage.setItem('__best_burgers_promos', JSON.stringify(updated));
    }
    fetchPricesAndPromos();
  };

  const deletePromo = async (vid: string) => {
    try {
      const res = await fetch(`/api/promotions/${vid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
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
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: promoState.variantId, discount: promoState.discount, active: true })
      });
      if (!res.ok) throw new Error();
    } catch {
      const newPromos = { ...promos, [promoState.variantId]: { variantId: promoState.variantId, discount: promoState.discount, active: true } };
      setPromos(newPromos);
      localStorage.setItem('__best_burgers_promos', JSON.stringify(newPromos));
    }
    setPromoState({ variantId: '', discount: 0 });
    fetchPricesAndPromos();
  };

  const handleAddBurger = () => {
    if (!burgerForm.name || burgerForm.priceS <= 0) return;
    addBurger(burgerForm.name, burgerForm.desc, burgerForm.priceS, burgerForm.priceD, burgerForm.priceT);
    setBurgerForm({ name: '', desc: '', priceS: 0, priceD: 0, priceT: 0 });
    setShowAddBurger(false);
    showToast(true, `Hamburguesa "${burgerForm.name}" agregada`);
  };

  const handleDeleteBurger = (id: string) => {
    const burger = menuBurgers.find(b => b.id === id);
    removeBurger(id);
    setConfirmDeleteBurger(null);
    showToast(true, `Hamburguesa "${burger?.name}" eliminada`);
  };

  const handleAddExtra = () => {
    if (!extraForm.name || extraForm.price <= 0) return;
    addExtra(extraForm.name, extraForm.price);
    setExtraForm({ name: '', price: 0 });
    setShowAddExtra(false);
    showToast(true, `Extra "${extraForm.name}" agregado`);
  };

  const handleDeleteExtra = (id: string) => {
    const extra = menuExtras.find(e => e.id === id);
    removeExtra(id);
    setConfirmDeleteExtra(null);
    showToast(true, `Extra "${extra?.name}" eliminado`);
  };

  const handleAddBeverage = () => {
    if (!beverageForm.name || beverageForm.price <= 0) return;
    addBeverage(beverageForm.name, beverageForm.price);
    setBeverageForm({ name: '', price: 0 });
    setShowAddBeverage(false);
    showToast(true, `Bebida "${beverageForm.name}" agregada`);
  };

  const handleDeleteBeverage = (id: string) => {
    const bev = menuBeverages.find(b => b.id === id);
    removeBeverage(id);
    setConfirmDeleteBeverage(null);
    showToast(true, `Bebida "${bev?.name}" eliminada`);
  };

  const allBurgerVariants = menuBurgers.flatMap(b => b.variants.map(v => ({ p: b.name, v: v.name, id: v.id })));

  const SectionHeader = ({ label }: { label: string }) => (
    <div style={{
      padding: '10px 18px',
      fontSize: '11px',
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-tertiary)',
    }}>
      {label}
    </div>
  );

  return (
    <div className="settings-scroll">
      <div className="settings-top-bar">
        <h2 className="settings-title">Configuración de Precios</h2>
        <button className="btn primary" onClick={savePrices}>Guardar todos los cambios</button>
      </div>

      {/* ── HAMBURGUESAS ───────────────────────── */}
      <div className="settings-section">
        <SectionHeader label="Hamburguesas" />
        {menuBurgers.map(b => (
          <div key={b.id} className="price-row" style={{ gap: '12px', flexWrap: 'wrap', alignItems: 'center', padding: '16px 18px' }}>
            {/* Burger name + delete */}
            <div style={{ minWidth: '120px', flex: '0 0 auto' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</div>
            </div>
            {/* Three variant inputs grouped */}
            <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '280px' }}>
              {b.variants.map(v => (
                <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', textAlign: 'center' }}>{v.name}</div>
                  <PriceInput
                    className="price-input"
                    style={{ width: '100%', textAlign: 'center' }}
                    value={localPrices[v.id] ?? 0}
                    onChange={n => handlePriceChange(v.id, String(n))}
                  />
                </div>
              ))}
            </div>
            {/* Delete button */}
            {confirmDeleteBurger === b.id ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--danger)' }}>¿Eliminar?</span>
                <button className="btn sm danger" onClick={() => handleDeleteBurger(b.id)}>Sí</button>
                <button className="btn sm" onClick={() => setConfirmDeleteBurger(null)}>No</button>
              </div>
            ) : (
              <button className="btn sm danger" onClick={() => setConfirmDeleteBurger(b.id)} title="Eliminar hamburguesa">🗑</button>
            )}
          </div>
        ))}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          {showAddBurger ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Nueva Hamburguesa</div>
              <div className="form-field">
                <div className="form-label">Nombre del producto</div>
                <input className="form-input" placeholder="Ej: BBQ Burger" value={burgerForm.name} onChange={e => setBurgerForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-field">
                <div className="form-label">Descripción</div>
                <input className="form-input" placeholder="Ingredientes..." value={burgerForm.desc} onChange={e => setBurgerForm(p => ({ ...p, desc: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="form-field">
                  <div className="form-label">Precio Simple</div>
                  <PriceInput className="price-input" style={{ width: '100%' }} value={burgerForm.priceS} onChange={n => setBurgerForm(p => ({ ...p, priceS: n }))} />
                </div>
                <div className="form-field">
                  <div className="form-label">Precio Doble</div>
                  <PriceInput className="price-input" style={{ width: '100%' }} value={burgerForm.priceD} onChange={n => setBurgerForm(p => ({ ...p, priceD: n }))} />
                </div>
                <div className="form-field">
                  <div className="form-label">Precio Triple</div>
                  <PriceInput className="price-input" style={{ width: '100%' }} value={burgerForm.priceT} onChange={n => setBurgerForm(p => ({ ...p, priceT: n }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn sm secondary" onClick={() => { setShowAddBurger(false); setBurgerForm({ name: '', desc: '', priceS: 0, priceD: 0, priceT: 0 }); }}>Cancelar</button>
                <button className="btn sm primary full" onClick={handleAddBurger} disabled={!burgerForm.name || burgerForm.priceS <= 0}>Guardar</button>
              </div>
            </div>
          ) : (
            <button className="btn sm secondary full" onClick={() => setShowAddBurger(true)}>+ Agregar Hamburguesa</button>
          )}
        </div>
      </div>

      {/* ── BEBIDAS ─────────────────────────────── */}
      <div className="settings-section">
        <SectionHeader label="Bebidas" />
        {menuBeverages.map(b => (
          <div key={b.id} className="price-row" style={{ gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '120px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{b.name}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minWidth: '200px', flex: 2 }}>
              {b.variants.map(v => (
                <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', textAlign: 'center' }}>{v.name}</div>
                  <PriceInput className="price-input" style={{ width: '100%', textAlign: 'center' }} value={localPrices[v.id] ?? 0} onChange={n => handlePriceChange(v.id, String(n))} />
                </div>
              ))}
            </div>
            {confirmDeleteBeverage === b.id ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--danger)' }}>¿Eliminar?</span>
                <button className="btn sm danger" onClick={() => handleDeleteBeverage(b.id)}>Sí</button>
                <button className="btn sm" onClick={() => setConfirmDeleteBeverage(null)}>No</button>
              </div>
            ) : (
              <button className="btn sm danger" onClick={() => setConfirmDeleteBeverage(b.id)} style={{ marginLeft: '8px' }} title="Eliminar bebida">🗑</button>
            )}
          </div>
        ))}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          {showAddBeverage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Nueva Bebida</div>
              <div className="form-field">
                <div className="form-label">Nombre</div>
                <input className="form-input" placeholder="Ej: Sprite" value={beverageForm.name} onChange={e => setBeverageForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-field">
                <div className="form-label">Precio</div>
                <PriceInput className="price-input" style={{ width: '100%' }} value={beverageForm.price} onChange={n => setBeverageForm(p => ({ ...p, price: n }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn sm secondary" onClick={() => { setShowAddBeverage(false); setBeverageForm({ name: '', price: 0 }); }}>Cancelar</button>
                <button className="btn sm primary full" onClick={handleAddBeverage} disabled={!beverageForm.name || beverageForm.price <= 0}>Guardar</button>
              </div>
            </div>
          ) : (
            <button className="btn sm secondary full" onClick={() => setShowAddBeverage(true)}>+ Agregar Bebida</button>
          )}
        </div>
      </div>

      {/* ── EXTRAS ──────────────────────────────── */}
      <div className="settings-section">
        <SectionHeader label="Extras" />
        {menuExtras.map(e => (
          <div key={e.id} className="price-row">
            <div className="price-name">{e.name}</div>
            <PriceInput className="price-input" value={localPrices[e.id] ?? 0} onChange={n => handlePriceChange(e.id, String(n))} />
            {confirmDeleteExtra === e.id ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginLeft: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--danger)' }}>¿Eliminar?</span>
                <button className="btn sm danger" onClick={() => handleDeleteExtra(e.id)}>Sí</button>
                <button className="btn sm" onClick={() => setConfirmDeleteExtra(null)}>No</button>
              </div>
            ) : (
              <button className="btn sm danger" onClick={() => setConfirmDeleteExtra(e.id)} style={{ marginLeft: '8px' }} title="Eliminar extra">🗑</button>
            )}
          </div>
        ))}
        <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
          {showAddExtra ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Nuevo Extra</div>
              <div className="form-field">
                <div className="form-label">Nombre</div>
                <input className="form-input" placeholder="Ej: Huevo frito" value={extraForm.name} onChange={e => setExtraForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-field">
                <div className="form-label">Precio</div>
                <PriceInput className="price-input" style={{ width: '100%' }} value={extraForm.price} onChange={n => setExtraForm(p => ({ ...p, price: n }))} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn sm secondary" onClick={() => { setShowAddExtra(false); setExtraForm({ name: '', price: 0 }); }}>Cancelar</button>
                <button className="btn sm primary full" onClick={handleAddExtra} disabled={!extraForm.name || extraForm.price <= 0}>Guardar</button>
              </div>
            </div>
          ) : (
            <button className="btn sm secondary full" onClick={() => setShowAddExtra(true)}>+ Agregar Extra</button>
          )}
        </div>
      </div>

      {/* ── PROMOCIONES ────────────────────────── */}
      <div className="settings-section">
        <SectionHeader label="Promociones" />
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

        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Nueva Promoción</div>
          <div className="form-field">
            <div className="form-label">Producto y Variante</div>
            <select className="form-input" value={promoState.variantId} onChange={e => setPromoState({ variantId: e.target.value, discount: 0 })} style={{ cursor: 'pointer' }}>
              <option value="">— Seleccioná —</option>
              {allBurgerVariants.map(v => <option key={v.id} value={v.id}>{v.p} — {v.v}</option>)}
            </select>
          </div>
          {promoState.variantId && (() => {
            const normalP = prices[promoState.variantId] || 0;
            const disc = promoState.discount;
            const finalP = Math.max(0, normalP - disc);
            return (
              <>
                <div className="form-field">
                  <div className="form-label">Descuento</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn sm" onClick={() => setPromoState(p => ({ ...p, discount: Math.max(0, p.discount - 100) }))} style={{ fontSize: '16px', padding: '4px 14px' }}>−</button>
                    <PriceInput className="form-input" value={disc} onChange={n => setPromoState(p => ({ ...p, discount: Math.max(0, Math.min(normalP, n)) }))} style={{ textAlign: 'center', flex: 1, fontFamily: 'Consolas, monospace' }} />
                    <button className="btn sm" onClick={() => setPromoState(p => ({ ...p, discount: Math.min(normalP, p.discount + 100) }))} style={{ fontSize: '16px', padding: '4px 14px' }}>+</button>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Precio normal</span>
                    <span style={{ fontFamily: 'Consolas, monospace' }}>{fmtPrice(normalP)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Descuento</span>
                    <span style={{ fontFamily: 'Consolas, monospace', color: 'var(--danger)' }}>−{fmtPrice(disc)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 600, borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                    <span>Precio Promo</span>
                    <span style={{ fontFamily: 'Consolas, monospace', color: 'var(--success)' }}>{fmtPrice(finalP)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn sm secondary" onClick={() => setPromoState({ variantId: '', discount: 0 })}>Cancelar</button>
                  <button className="btn sm primary full" onClick={savePromo} disabled={disc <= 0}>Guardar Promoción</button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
