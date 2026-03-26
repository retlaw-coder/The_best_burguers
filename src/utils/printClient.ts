import { getVariantById, getExtraById } from '../constants/menu';
import { PromoData } from '../store/store';

export async function triggerPrint(
  ticketId: string,
  items: { variantId: string; isPromo?: boolean; extras: string[] }[],
  total: number,
  co: { address?: string; name?: string; shipping?: number | null; payment?: string; deliveryPersonId?: string | null; deliveryPersonName?: string | null },
  prices: Record<string, number>,
  promos: Record<string, PromoData>,
  createdAtStr?: string
) {
  const payload = {
    ticketId,
    createdAt: createdAtStr || new Date().toISOString(),
    customerName: co.name,
    address: co.address,
    deliveryPersonName: co.deliveryPersonName,
    paymentMethod: co.payment || 'CASH',
    shipping: co.shipping || 0,
    total,
    items: items.map(i => {
      const v = getVariantById(i.variantId);
      const basePrice = prices[i.variantId] || 0;
      const isPromo = !!i.isPromo;
      const promoDiscount = isPromo && promos[i.variantId]?.active ? promos[i.variantId].discount : 0;
      
      const realItemPrice = isPromo ? Math.max(0, basePrice - promoDiscount) : basePrice;
      
      const extras = i.extras.map(eid => {
        const ex = getExtraById(eid);
        return {
          name: ex?.name || 'Extra',
          price: prices[eid] || ex?.price || 0
        };
      });

      return {
        name: v ? `${v.product.name} ${v.variant.name}` : 'Ítem',
        price: realItemPrice,
        isPromo,
        promoDiscount,
        extras
      };
    })
  };

  try {
    const res = await fetch('/api/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error('Error del servidor de impresión:', await res.text());
    }
  } catch (err) {
    console.error('Error contactando al servidor de impresión:', err);
  }
}
