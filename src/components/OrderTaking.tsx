import React from 'react';
import { useStore, SlotState } from '../store/store';
import { MENU, fmtPrice, getVariantById, getExtraById } from '../constants/menu';
import { buildTicketText } from '../utils/ticket';
import { PriceInput } from './PriceInput';

export function OrderTaking() {
  const slots = useStore(state => state.slots);

  return (
    <div className="order-taking">
      <div className="order-taking-header">
        <h2>Captura de Pedidos</h2>
      </div>
      <div className="slots-container" id="slots-container">
        {slots.map((slot, idx) => (
          <Slot key={slot.id} slot={slot} />
        ))}
      </div>
    </div>
  );
}

function Slot({ slot }: { slot: SlotState }) {
  const { activateSlot, resetSlot } = useStore();

  if (slot.state === 'empty') {
    return (
      <div className={`slot`} id={`slot-${slot.id}`}>
        <div className="slot-empty" onClick={() => activateSlot(slot.id)}>
          <div className="plus-icon">+</div>
          <span>Nuevo Pedido</span>
        </div>
      </div>
    );
  }

  if (slot.state === 'pending') {
    return <PendingSlot slot={slot} />;
  }

  return <ActiveSlot slot={slot} />;
}

function ActiveSlot({ slot }: { slot: SlotState }) {
  const { updateSlot, resetSlot, prices, promos } = useStore();

  const handleCancelClick = () => {
    if (slot.items.length === 0) resetSlot(slot.id);
    else updateSlot(slot.id, { _confirmCancel: true });
  };

  const calcTotal = () => {
    return slot.items.reduce((sum, item) => {
      let base = prices[item.variantId] || 0;
      if (item.isPromo && promos[item.variantId]?.active) {
        base = Math.max(0, base - promos[item.variantId].discount);
      }
      const ext = item.extras.reduce((s, e) => s + (prices[e] || getExtraById(e)?.price || 0), 0);
      return sum + base + ext;
    }, 0) + (slot.checkout.deliveryType === 'DELIVERY' ? (slot.checkout.shipping || 0) : 0);
  };

  const removeItem = (idx: number) => {
    const newItems = [...slot.items];
    newItems.splice(idx, 1);
    updateSlot(slot.id, { items: newItems });
  };

  const editItem = (idx: number) => {
    const item = slot.items[idx];
    const found = getVariantById(item.variantId);
    if (!found) return;
    updateSlot(slot.id, {
      wizard: {
        step: 0,
        burgerId: found.isBurger ? found.product.id : null,
        beverageId: !found.isBurger ? found.product.id : null,
        burgerVariantId: found.isBurger ? item.variantId : null,
        beverageVariantId: !found.isBurger ? item.variantId : null,
        burgerIsPromo: item.isPromo,
        extras: [...item.extras],
        editingIndex: idx,
        qty: 1
      }
    });
  };

  return (
    <div className="slot active" id={`slot-${slot.id}`}>
      <div className="slot-header">
        <div className="slot-number">{slot.id}</div>
        <div className="slot-title">Pedido {slot.id}</div>
        <div className="slot-total">{fmtPrice(calcTotal())}</div>
      </div>
      <div className="slot-body">
        {slot.items.length > 0 && (
          <div className="items-list">
            {slot.items.map((item, idx) => {
              const found = getVariantById(item.variantId);
              let base = prices[item.variantId] || 0;
              if (item.isPromo && promos[item.variantId]?.active) base = Math.max(0, base - promos[item.variantId].discount);
              const ext = item.extras.reduce((s, e) => s + (prices[e] || getExtraById(e)?.price || 0), 0);

              return (
                <div key={idx} className="item-card" onClick={() => editItem(idx)}>
                  <div className="item-card-info">
                    <div className="item-card-name">
                      {found ? `${found.product.name} ${found.variant.name}` : 'Item'}
                      {item.isPromo && <span className="promo-badge">PROMO</span>}
                    </div>
                    {item.extras.length > 0 && (
                      <div className="item-card-extras">+ {item.extras.map(e => getExtraById(e)?.name).join(', ')}</div>
                    )}
                  </div>
                  <div className={`item-card-price ${item.isPromo ? 'promo-price' : ''}`}>{fmtPrice(base + ext)}</div>
                  <button className="item-card-remove" onClick={(e) => { e.stopPropagation(); removeItem(idx); }}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        <Wizard slot={slot} />
        {(!slot.wizard && slot.items.length > 0) && <Checkout slot={slot} calcTotal={calcTotal} />}

        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
          {slot._confirmCancel ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--danger)' }}>¿Cancelar pedido?</span>
              <button className="btn sm danger" onClick={() => resetSlot(slot.id)}>Confirmar</button>
              <button className="btn sm" onClick={() => updateSlot(slot.id, { _confirmCancel: false })}>No</button>
            </div>
          ) : (
            <button className="btn sm danger" onClick={handleCancelClick}>Cancelar pedido</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Wizard({ slot }: { slot: SlotState }) {
  const { updateSlot, prices, promos, menuBurgers, menuBeverages, menuExtras } = useStore();
  const w = slot.wizard;
  if (!w) {
    return (
      <div style={{ padding: '10px 16px 0' }}>
        <button className="btn full secondary" onClick={() => updateSlot(slot.id, { wizard: { step: 0, burgerId: null, beverageId: null, burgerVariantId: null, beverageVariantId: null, extras: [], qty: 1 } })}>+ Agregar ítem</button>
      </div>
    );
  }

  const act = (update: any) => updateSlot(slot.id, { wizard: { ...w, ...update } });

  const renderStep0 = () => (
    <>
      <div className="wizard-title">¿Qué lleva? (podés elegir hamburguesa y bebida)</div>
      <div style={{ marginBottom: '10px' }}>
        <div className="wizard-title" style={{ marginBottom: '6px' }}>Hamburguesa</div>
        <div className="options-grid cols-5">
          {menuBurgers.map(b => (
            <button key={b.id} className={`option-btn ${w.burgerId === b.id ? 'selected' : ''}`} onClick={() => act({ burgerId: w.burgerId === b.id ? null : b.id, burgerVariantId: null })}>
              {b.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="wizard-title" style={{ marginBottom: '6px' }}>Bebida (opcional)</div>
        <div className="options-grid cols-3">
          {menuBeverages.map(b => (
            <button key={b.id} className={`option-btn ${w.beverageId === b.id ? 'selected' : ''}`} onClick={() => act({ beverageId: w.beverageId === b.id ? null : b.id, beverageVariantId: null })}>
              {b.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  const renderStep1 = () => {
    const burger = w.burgerId ? menuBurgers.find(p => p.id === w.burgerId) : null;
    const beverage = w.beverageId ? menuBeverages.find(p => p.id === w.beverageId) : null;

    return (
      <>
        {burger && (
          <div style={{ marginBottom: '10px' }}>
            <div className="wizard-title" style={{ marginBottom: '6px' }}>Tamaño — {burger.name}</div>
            <div className="options-grid cols-3">
              {burger.variants.map(v => {
                const p = promos[v.id];
                const activePromo = p?.active ? p : null;
                const normP = prices[v.id] || v.price;
                const isSel = w.burgerVariantId === v.id;
                
                if (activePromo) {
                  const pPrice = Math.max(0, normP - activePromo.discount);
                  return (
                    <div key={v.id} className="split-btn">
                      <div className="split-btn-name">{v.name}</div>
                      <div className="split-btn-row">
                        <button className={`split-half split-normal ${isSel && !w.burgerIsPromo ? 'chosen' : ''}`} onClick={() => act({ burgerVariantId: v.id, burgerIsPromo: false })}>
                          <span className="split-label">Normal</span><span className="split-price">{fmtPrice(normP)}</span>
                        </button>
                        <button className={`split-half split-promo ${isSel && w.burgerIsPromo ? 'chosen' : ''}`} onClick={() => act({ burgerVariantId: v.id, burgerIsPromo: true })}>
                          <span className="split-label">Promo</span><span className="split-price">{fmtPrice(pPrice)}</span>
                        </button>
                      </div>
                    </div>
                  );
                }
                
                return (
                  <button key={v.id} className={`option-btn ${isSel ? 'selected' : ''}`} onClick={() => act({ burgerVariantId: v.id, burgerIsPromo: false })}>
                    <span>{v.name}</span><span className="price">{fmtPrice(normP)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {beverage && (
          <div>
            <div className="wizard-title" style={{ marginBottom: '6px' }}>Tamaño — {beverage.name}</div>
            <div className="options-grid cols-2">
              {beverage.variants.map(v => (
                <button key={v.id} className={`option-btn ${w.beverageVariantId === v.id ? 'selected' : ''}`} onClick={() => act({ beverageVariantId: v.id })}>
                  <span>{v.name}</span><span className="price">{fmtPrice(prices[v.id] || v.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderStep2 = () => (
    <>
      <div className="wizard-title">Extras (opcional)</div>
      <div className="extras-grid">
        {menuExtras.map(e => (
          <div key={e.id} className={`extra-pill ${w.extras.includes(e.id) ? 'selected' : ''}`} onClick={() => {
            const nextExtras = w.extras.includes(e.id) ? w.extras.filter(x => x !== e.id) : [...w.extras, e.id];
            act({ extras: nextExtras });
          }}>
            <span>{e.name}</span><span className="eprice">{fmtPrice(prices[e.id] || e.price)}</span>
          </div>
        ))}
      </div>

      {/* Quantity Selector */}
      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div className="wizard-title" style={{ marginBottom: 0 }}>Cantidad</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <button
            className="btn sm"
            style={{ borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', padding: '6px 14px', fontSize: '16px', fontWeight: 600 }}
            onClick={() => act({ qty: Math.max(1, (w.qty || 1) - 1) })}
          >−</button>
          <input
            type="number"
            min={1}
            max={99}
            value={w.qty || 1}
            onChange={e => act({ qty: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
            style={{
              width: '48px',
              textAlign: 'center',
              padding: '6px 4px',
              border: '1px solid var(--border)',
              borderLeft: 'none',
              borderRight: 'none',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'Consolas, monospace',
              fontWeight: 600,
              outline: 'none',
              MozAppearance: 'textfield' as any,
              appearance: 'textfield' as any,
            }}
          />
          <button
            className="btn sm"
            style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '6px 14px', fontSize: '16px', fontWeight: 600 }}
            onClick={() => act({ qty: Math.min(99, (w.qty || 1) + 1) })}
          >+</button>
        </div>
        {(w.qty || 1) > 1 && (
          <span style={{ fontSize: '12px', color: 'var(--accent)', fontFamily: 'Consolas, monospace' }}>×{w.qty}</span>
        )}
      </div>
    </>
  );

  const canNext = (w.step === 0 && (w.burgerId || w.beverageId)) ||
                  (w.step === 1 && (!w.burgerId || w.burgerVariantId) && (!w.beverageId || w.beverageVariantId) && (w.burgerId || w.beverageId)) ||
                  w.step === 2;

  const onConfirm = () => {
    const qty = w.qty || 1;
    const baseItems = [];
    if (w.burgerVariantId) baseItems.push({ variantId: w.burgerVariantId, extras: [...w.extras], isPromo: !!w.burgerIsPromo });
    if (w.beverageVariantId) baseItems.push({ variantId: w.beverageVariantId, extras: [] });

    // Replicate items by qty
    const newItems = [];
    for (let i = 0; i < qty; i++) {
      newItems.push(...baseItems.map(item => ({ ...item, extras: [...item.extras] })));
    }

    const currentItems = [...slot.items];
    if (w.editingIndex !== undefined) {
      if (newItems.length === 0) currentItems.splice(w.editingIndex, 1);
      else currentItems.splice(w.editingIndex, 1, ...newItems);
    } else {
      currentItems.push(...newItems);
    }
    updateSlot(slot.id, { items: currentItems, wizard: null });
  };

  return (
    <div className="wizard">
      <div className="wizard-steps">
        {[0,1,2].map(i => <div key={i} className={`wizard-step ${i < w.step ? 'done' : i === w.step ? 'active' : ''}`} />)}
      </div>
      {w.step === 0 && renderStep0()}
      {w.step === 1 && renderStep1()}
      {w.step === 2 && renderStep2()}
      
      <div className="wizard-nav">
        {w.step > 0 && <button className="btn sm secondary" onClick={() => act({ step: w.step - 1 })}>← Atrás</button>}
        <button className="btn sm secondary" onClick={() => updateSlot(slot.id, { wizard: null })}>Cancelar</button>
        <div style={{ flex: 1 }} />
        {w.step < 2 ? (
          <button className="btn sm primary" disabled={!canNext} onClick={() => act({ step: w.step + 1 })}>Siguiente →</button>
        ) : (
          <button className="btn sm primary" onClick={onConfirm}>{w.editingIndex !== undefined ? 'Actualizar' : `Agregar${(w.qty || 1) > 1 ? ` (×${w.qty})` : ''}`}</button>
        )}
      </div>
    </div>
  );
}

function Checkout({ slot, calcTotal }: { slot: SlotState, calcTotal: () => number }) {
  const { updateSlot, orders, setOrders } = useStore();
  const co = slot.checkout;
  const isTakeAway = co.deliveryType === 'TAKE_AWAY';
  const canConfirm = !!co.name && (isTakeAway || (co.shipping !== null && !!co.address));

  const up = (field: string, val: any) => updateSlot(slot.id, { checkout: { ...co, [field]: val } });

  const confirm = async () => {
    if (!canConfirm) return;
    const now = new Date();
    const dd = String(now.getDate()).padStart(2,'0');
    const seq = String(orders.length + 1).padStart(3,'0');
    const ticketId = co.name.toUpperCase().replace(/\s+/g,'').slice(0,8) || `${dd}${seq}`;
    
    updateSlot(slot.id, { state: 'pending', ticketId, wizard: null });
    
    const el = document.getElementById('global-toast');
    if (el) { el.className = 'toast visible success'; document.getElementById('global-toast-msg')!.textContent = `Pedido ${ticketId} confirmado`; setTimeout(() => el.className='toast', 2500); }
  };

  return (
    <div className="checkout">
      <div className="checkout-title">Datos del pedido</div>
      
      <div style={{ marginBottom: '16px' }}>
        <div className="form-label" style={{ marginBottom: '6px' }}>Tipo de pedido</div>
        <div className="toggle-group">
          <div className={`toggle-opt ${co.deliveryType === 'DELIVERY' ? 'selected' : ''}`} onClick={() => up('deliveryType', 'DELIVERY')}>🛵 Delivery</div>
          <div className={`toggle-opt ${co.deliveryType === 'TAKE_AWAY' ? 'selected' : ''}`} onClick={() => updateSlot(slot.id, { checkout: { ...co, deliveryType: 'TAKE_AWAY', shipping: null, address: '' } })}>🥡 Take away</div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <div className="form-label">Nombre *</div>
          <input className="form-input" placeholder="Nombre" value={co.name} onChange={e => up('name', e.target.value)} />
        </div>
        {!isTakeAway && (
          <div className="form-field">
            <div className="form-label">Dirección *</div>
            <input className="form-input" placeholder="Calle y número" value={co.address} onChange={e => up('address', e.target.value)} />
          </div>
        )}
      </div>
      
      {!isTakeAway && (
        <div style={{ marginBottom: '16px' }}>
          <div className="form-label" style={{ marginBottom: '6px' }}>Costo de envío *</div>
          <PriceInput
            className="form-input"
            value={co.shipping !== null && co.shipping >= 0 ? co.shipping : 0}
            onChange={n => up('shipping', n >= 0 ? n : null)}
            placeholder="Ej: 2.000"
            style={{ fontFamily: 'Consolas, monospace', textAlign: 'left', width: '100%', maxWidth: '200px' }}
          />
        </div>
      )}
      <div>
        <div className="form-label" style={{ marginBottom: '6px' }}>Método de pago</div>
        <div className="toggle-group">
          <div className={`toggle-opt ${co.payment === 'CASH' ? 'selected' : ''}`} onClick={() => up('payment', 'CASH')}>💵 Efectivo</div>
          <div className={`toggle-opt ${co.payment === 'TRANSFER' ? 'selected' : ''}`} onClick={() => up('payment', 'TRANSFER')}>📲 Transferencia</div>
        </div>
      </div>
      <div className="checkout-total">
        <span className="checkout-total-label">Total del pedido</span>
        <span className="checkout-total-amount">{fmtPrice(calcTotal())}</span>
      </div>
      <button className="btn primary full" disabled={!canConfirm} onClick={confirm}>Confirmar pedido →</button>
    </div>
  );
}

function PendingSlot({ slot }: { slot: SlotState }) {
  const { updateSlot, resetSlot, prices, promos, fetchOrders, openModal } = useStore();
  
  const calcTotal = () => {
    return slot.items.reduce((sum, item) => {
      let base = prices[item.variantId] || 0;
      if (item.isPromo && promos[item.variantId]?.active) base = Math.max(0, base - promos[item.variantId].discount);
      const ext = item.extras.reduce((s, e) => s + (prices[e] || getExtraById(e)?.price || 0), 0);
      return sum + base + ext;
    }, 0) + (slot.checkout.deliveryType === 'DELIVERY' ? (slot.checkout.shipping || 0) : 0);
  };

  const markPaid = async () => {
    const total = calcTotal();
    const orderBody = {
      ticketId: slot.ticketId,
      customerName: slot.checkout.name,
      address: slot.checkout.address,
      paymentMethod: slot.checkout.payment,
      status: 'PREPARING',
      total,
      shipping: slot.checkout.shipping,
      items: slot.items.map(i => ({ variantId: i.variantId, label: 'Ítem', isPromo: i.isPromo, price: 0, extras: i.extras }))
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody)
      });
      if (!res.ok) throw new Error();
    } catch {
      console.warn('Backend unavailable, saving order to localStorage');
      const newOrder = { 
        ...orderBody, 
        id: Date.now().toString(), 
        createdAt: new Date().toISOString(),
        name: slot.checkout.name,
        payment: slot.checkout.payment,
        expanded: false
      };
      // remove the incorrect duplicated keys that were meant for the API
      delete (newOrder as any).customerName;
      delete (newOrder as any).paymentMethod;
      
      const localO = localStorage.getItem('__best_burgers_orders');
      const ordersArr = localO ? JSON.parse(localO) : [];
      ordersArr.unshift(newOrder);
      localStorage.setItem('__best_burgers_orders', JSON.stringify(ordersArr));
    }
    
    await fetchOrders(); // refresh state
    resetSlot(slot.id);
    const el = document.getElementById('global-toast');
    if (el) { el.className = 'toast visible success'; document.getElementById('global-toast-msg')!.textContent = `Pedido ${slot.ticketId} en preparación`; setTimeout(() => el.className='toast', 2500); }
  };

  return (
    <div className="slot active" id={`slot-${slot.id}`}>
      <div className="slot-header">
        <div className="slot-number" style={{ background: 'var(--warning)', color: '#000' }}>{slot.id}</div>
        <div className="slot-title">{slot.ticketId}</div>
        <span className="status-badge pending">Pendiente de pago</span>
        <div className="slot-total">{fmtPrice(calcTotal())}</div>
      </div>
      <div className="slot-pending-body">
        <div className="slot-pending-info">
          <div className="slot-pending-detail">📍 <span>{slot.checkout.address || '—'}</span></div>
          {slot.checkout.name && <div className="slot-pending-detail">👤 <span>{slot.checkout.name}</span></div>}
          <div className="slot-pending-detail">💳 <span>{slot.checkout.payment === 'CASH' ? 'Efectivo' : 'Transferencia'}</span></div>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {slot.items.map(i => getVariantById(i.variantId)).map(i => i ? `${i.product.name} ${i.variant.name}` : '').join(', ')}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn sm primary" onClick={markPaid}>✓ Marcar pagado</button>
          <button className="btn sm" onClick={() => openModal('Ticket de impresión', buildTicketText(slot.ticketId!, slot.items, calcTotal(), slot.checkout, prices, promos))}>🖨 Imprimir</button>
          {slot._confirmCancelPending ? (
            <>
              <button className="btn sm danger" onClick={() => resetSlot(slot.id)}>Confirmar cancelación</button>
              <button className="btn sm secondary" onClick={() => updateSlot(slot.id, { _confirmCancelPending: false })}>No</button>
            </>
          ) : (
            <button className="btn sm danger" onClick={() => updateSlot(slot.id, { _confirmCancelPending: true })}>Cancelar</button>
          )}
        </div>
      </div>
    </div>
  );
}
