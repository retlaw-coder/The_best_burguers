import React, { useState } from 'react';
import { useStore, OrderData } from '../store/store';
import { fmtPrice, getVariantById, getExtraById } from '../constants/menu';
import { buildTicketText } from '../utils/ticket';
import { triggerPrint } from '../utils/printClient';

export function ActiveOrders() {
  const [tab, setTab] = useState<'active'|'delivered'>('active');
  const { orders } = useStore();

  const filtered = orders.filter(o => {
    if (tab === 'active') return o.status !== 'COMPLETED';
    return o.status === 'COMPLETED';
  });

  return (
    <div className="orders-panel">
      <div className="orders-panel-header">
        <div className="tabs">
          <div className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>En Curso</div>
          <div className={`tab ${tab === 'delivered' ? 'active' : ''}`} onClick={() => setTab('delivered')}>Entregados</div>
        </div>
      </div>
      <div className="orders-list" id="orders-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">
              {tab === 'active' ? <>Los pedidos confirmados<br />aparecerán aquí</> : 'No hay pedidos entregados hoy'}
            </div>
          </div>
        ) : (
          filtered.map(o => <OrderCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: OrderData }) {
  const { setOrders, orders, prices, promos, openModal, deleteOrder } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusMap = { PREPARING: 'preparing', SENT: 'sent', COMPLETED: 'completed' };
  const statusLabel = { PREPARING: 'Preparando', SENT: 'Enviado', COMPLETED: 'Completado' };
  const nextAction = { PREPARING: { label: 'Marcar Enviado →', action: 'SENT' }, SENT: { label: 'Marcar Entregado ✓', action: 'COMPLETED' }, COMPLETED: null };

  const itemsSummary = order.items.map(i => {
    const v = getVariantById(i.variantId);
    return v ? `${v.product.name} ${v.variant.name}` : 'Ítem';
  }).join(', ');

  const toggleExpand = () => {
    setOrders(orders.map(o => o.id === order.id ? { ...o, expanded: !o.expanded } : o));
  };

  const advance = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error();
    } catch {
      console.warn('Backend unavailable, advancing order in localStorage');
      const localO = localStorage.getItem('__best_burgers_orders');
      if (localO) {
        const ordersArr = JSON.parse(localO);
        const updatedArr = ordersArr.map((o: any) => o.id === order.id ? { ...o, status: newStatus } : o);
        localStorage.setItem('__best_burgers_orders', JSON.stringify(updatedArr));
      }
    }

    setOrders(orders.map(o => o.id === order.id ? { ...o, status: newStatus as any } : o));

    if (newStatus === 'COMPLETED') {
      const el = document.getElementById('global-toast');
      if (el) { el.className = 'toast visible success'; document.getElementById('global-toast-msg')!.textContent = `Pedido ${order.ticketId} completado`; setTimeout(() => el.className='toast', 2500); }
    }
  };

  const handleDelete = () => {
    deleteOrder(order.id);
    const el = document.getElementById('global-toast');
    if (el) { el.className = 'toast visible success'; document.getElementById('global-toast-msg')!.textContent = `Pedido ${order.ticketId} eliminado`; setTimeout(() => el.className='toast', 2500); }
  };

  return (
    <div className={`order-card ${order.expanded ? 'expanded' : ''}`}>
      <div className="order-card-header" onClick={toggleExpand}>
        <div>
          <div className="order-ticket">#{order.ticketId}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {itemsSummary.slice(0, 30)}{itemsSummary.length > 30 ? '…' : ''}
          </div>
        </div>
        <span className={`status-badge ${statusMap[order.status]}`}>{statusLabel[order.status]}</span>
        <div className="order-total-sm">{fmtPrice(order.total)}</div>
      </div>
      <div className="order-detail">
        <div className="order-detail-body">
          <div className="order-detail-items">
            {order.items.map((item, idx) => {
              const v = getVariantById(item.variantId);
              let base = prices[item.variantId] || 0;
              if (item.isPromo && promos[item.variantId]?.active) base = Math.max(0, base - promos[item.variantId].discount);
              const ext = item.extras.reduce((s, e) => s + (prices[e] || getExtraById(e)?.price || 0), 0);

              return (
                <div key={idx}>
                  <div className="order-detail-item">
                    <span>{v ? `${v.product.name} ${v.variant.name}` : 'Ítem'}{item.isPromo && <span className="promo-badge">PROMO</span>}</span>
                    <span className={item.isPromo ? 'promo-price' : ''}>{fmtPrice(base + ext)}</span>
                  </div>
                  {item.extras.map(e => {
                    const ex = getExtraById(e);
                    return ex ? <div key={e} className="order-detail-item"><span style={{ paddingLeft: '12px', color: 'var(--text-muted)' }}>+ {ex.name}</span><span>{fmtPrice(prices[e] || ex.price)}</span></div> : null;
                  })}
                </div>
              );
            })}
            <div className="order-detail-item" style={{ borderTop: '1px solid var(--border)', paddingTop: '4px', marginTop: '4px' }}>
              <span>Envío</span><span>{fmtPrice(order.shipping || 0)}</span>
            </div>
            <div className="order-detail-item">
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Total</span>
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{fmtPrice(order.total)}</span>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            📍 {order.address || 'Take away'} {order.name ? '· 👤 ' + order.name : ''}
            <br />· {order.payment === 'CASH' ? '💵 Efectivo' : '📲 Transferencia'}
          </div>
          <div className="order-actions">
            <button className="btn sm" onClick={() => {
              openModal('Ticket', buildTicketText(order.ticketId, order.items, order.total, { address: order.address, name: order.name, shipping: order.shipping }, prices, promos));
              triggerPrint(order.ticketId, order.items, order.total, { address: order.address, name: order.name, shipping: order.shipping, payment: order.payment, deliveryPersonName: order.deliveryPersonName }, prices, promos, order.createdAt);
            }}>🖨 Imprimir</button>
            {nextAction[order.status] && (
              <button className="btn sm primary" onClick={() => advance(nextAction[order.status]!.action)}>
                {nextAction[order.status]!.label}
              </button>
            )}
            {confirmDelete ? (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--danger)' }}>¿Eliminar?</span>
                <button className="btn sm danger" onClick={handleDelete}>Sí</button>
                <button className="btn sm" onClick={() => setConfirmDelete(false)}>No</button>
              </div>
            ) : (
              <button className="btn sm danger" onClick={() => setConfirmDelete(true)} title="Eliminar pedido">🗑</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
