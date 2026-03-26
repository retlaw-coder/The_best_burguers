import { getVariantById, getExtraById, fmtPrice } from '../constants/menu';
import { PromoData } from '../store/store';

export function buildTicketText(
  ticketId: string,
  items: { variantId: string; isPromo?: boolean; extras: string[] }[],
  total: number,
  co: { address?: string; name?: string; shipping?: number | null },
  prices: Record<string, number>,
  promos: Record<string, PromoData>
): string {
  const lines = [
    'THE BEST BURGERS',
    '-------------------------',
  ];

  const itemLabel = (item: any) => {
    const found = getVariantById(item.variantId);
    if (!found) return 'Ítem';
    return `${found.product.name} ${found.variant.name}`;
  };

  const promoPrice = (vid: string) => {
    const base = prices[vid] || 0;
    const p = promos[vid];
    return p?.active ? Math.max(0, base - p.discount) : base;
  };

  const itemPrice = (item: any) => {
    const base = item.isPromo ? promoPrice(item.variantId) : (prices[item.variantId] || 0);
    const extrasPrice = (item.extras || []).reduce((s: number, eid: string) => s + (prices[eid] || getExtraById(eid)?.price || 0), 0);
    return base + extrasPrice;
  };

  items.forEach(item => {
    const label = itemLabel(item);
    if (item.isPromo) {
      const normalP = prices[item.variantId] || 0;
      const finalP  = promoPrice(item.variantId);
      const disc    = normalP - finalP;
      const extrasPrice = (item.extras || []).reduce((s: number, eid: string) => s + (prices[eid] || getExtraById(eid)?.price || 0), 0);
      
      const l1 = label, p1 = fmtPrice(normalP);
      lines.push(l1 + ' '.repeat(Math.max(1, 25 - l1.length - p1.length)) + p1);
      
      const l2 = '  >> Descuento Promo', p2 = '-' + fmtPrice(disc);
      lines.push(l2 + ' '.repeat(Math.max(1, 25 - l2.length - p2.length)) + p2);
      
      if (extrasPrice > 0) {
        (item.extras || []).forEach(eid => {
          const extra = getExtraById(eid);
          if (extra) {
            const eName = '  + ' + extra.name;
            const ePrice = fmtPrice(prices[eid] || extra.price);
            lines.push(eName + ' '.repeat(Math.max(1, 25 - eName.length - ePrice.length)) + ePrice);
          }
        });
      }
    } else {
      const price = fmtPrice(itemPrice(item));
      const pad = 25 - label.length - price.length;
      lines.push(label + ' '.repeat(Math.max(1, pad)) + price);
      
      if (item.extras && item.extras.length > 0) {
        item.extras.forEach(eid => {
          const extra = getExtraById(eid);
          if (extra) {
            const eName = '  + ' + extra.name;
            const ePrice = fmtPrice(prices[eid] || extra.price);
            const ePad = 25 - eName.length - ePrice.length;
            lines.push(eName + ' '.repeat(Math.max(1, ePad)) + ePrice);
          }
        });
      }
    }
  });

  const shippingLabel = 'Envío';
  const shippingPricestr = fmtPrice(co.shipping || 0);
  const shippingPad = 25 - shippingLabel.length - shippingPricestr.length;
  lines.push(shippingLabel + ' '.repeat(Math.max(1, shippingPad)) + shippingPricestr);
  lines.push('');
  
  lines.push('-------------------------');
  
  const totalLabel = 'TOTAL';
  const totalPrice = fmtPrice(total);
  const totalPad = 25 - totalLabel.length - totalPrice.length;
  lines.push(totalLabel + ' '.repeat(Math.max(1, totalPad)) + totalPrice);
  
  lines.push('');
  if (co.address && co.address.trim() !== '') lines.push('DIRECCIÓN: ' + co.address.trim());
  if (co.name && co.name.trim() !== '') lines.push('NOMBRE: ' + co.name.trim());
  lines.push('');
  lines.push('Gracias por su compra.');
  
  return lines.join('\n');
}
