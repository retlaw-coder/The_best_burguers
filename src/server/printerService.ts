import escpos from 'escpos';
import escposUsb from 'escpos-usb';

// @ts-ignore
escpos.USB = escposUsb;

export interface PrintExtra {
  name: string;
  price: number;
}

export interface PrintItem {
  name: string;
  price: number;
  isPromo: boolean;
  promoDiscount: number;
  extras: PrintExtra[];
}

export interface PrintOrderPayload {
  ticketId: string;
  createdAt: string;
  customerName?: string;
  address?: string;
  deliveryPersonName?: string;
  paymentMethod: string;
  shipping: number;
  total: number;
  items: PrintItem[];
}

export interface GroupedItem extends PrintItem {
  qty: number;
}

export function groupOrderItems(items: PrintItem[]): GroupedItem[] {
  const map = new Map<string, GroupedItem>();
  
  for (const item of items) {
    const key = item.name + '|' + item.isPromo + '|' + item.extras.map(e => e.name).sort().join(',');
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.qty += 1;
      existing.price += item.price;
      existing.promoDiscount += item.promoDiscount;
      // extras prices are also multiplied as we will just sum them up or display unit extra price
    } else {
      map.set(key, { ...item, qty: 1 });
    }
  }
  return Array.from(map.values());
}

export function formatLine(textLeft: string, textRight: string, totalWidth: number = 32): string {
  const rightLen = textRight.length;
  // Minimum 1 space between left and right
  const maxLeftLen = totalWidth - rightLen - 1;
  
  let left = textLeft;
  if (left.length > maxLeftLen) {
    // Truncate and add ellipsis "..."
    left = left.slice(0, Math.max(0, maxLeftLen - 3)) + '...';
  }
  
  const spaces = totalWidth - left.length - rightLen;
  return left + ' '.repeat(Math.max(1, spaces)) + textRight;
}

function fmtPrice(num: number): string {
  return '$' + num.toLocaleString('es-AR');
}

export async function printOrder(order: PrintOrderPayload) {
  return new Promise<void>((resolve, reject) => {
    let device;
    try {
      device = new escpos.USB();
    } catch (e) {
      console.error('[Printer] No se detectó impresora USB conectada. Imprimiendo simulación en consola...');
      simulatePrint(order);
      return resolve();
    }

    const options = { encoding: "GB18030" };
    const printer = new escpos.Printer(device, options);

    device.open(function(error: any) {
      if (error) {
        console.error('[Printer] Error abriendo dispositivo:', error);
        return reject(error);
      }

      const grouped = groupOrderItems(order.items);
      const dateStr = new Date(order.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

      // ==========================================
      // TICKET 1: COMANDA DE COCINA
      // ==========================================
      printer
        .font('A')
        .align('CT')
        .style('B')
        .size(1, 1)
        .text('--- COMANDA ---')
        .size(0, 0)
        .text('')
        .align('LT')
        .style('NORMAL')
        .text(`Ticket: ${order.ticketId}`)
        .text(`Fecha:  ${dateStr}`)
        .text('');

      if (order.deliveryPersonName) {
        printer.text(`Repartidor: ${order.deliveryPersonName}`).text('');
      }

      printer.text('-'.repeat(32));

      for (const item of grouped) {
        printer.style('B').text(`${item.qty}x ${item.name}`);
        printer.style('NORMAL');
        for (const ext of item.extras) {
          printer.text(`   + ${ext.name}`);
        }
      }

      printer
        .text('')
        .text('')
        .align('CT')
        .text('-'.repeat(32))
        .text('(CORTAR AQUI)')
        .text('-'.repeat(32))
        .text('')
        .text('');

      // ==========================================
      // TICKET 2: RECIBO CLIENTE
      // ==========================================
      printer
        .align('CT')
        .style('B')
        .size(1, 1)
        .text('THE BEST BURGERS')
        .size(0, 0)
        .style('NORMAL')
        .text('')
        .align('LT');

      for (const item of grouped) {
        const line = formatLine(`${item.qty}x ${item.name}`, fmtPrice(item.price));
        printer.text(line);
        
        if (item.isPromo && item.promoDiscount > 0) {
          const promoLine = formatLine(` >> Promo`, `-${fmtPrice(item.promoDiscount)}`);
          printer.text(promoLine);
        }

        for (const ext of item.extras) {
          // Extra price multiplied by qty
          const extLine = formatLine(`   + ${ext.name}`, fmtPrice(ext.price * item.qty));
          printer.text(extLine);
        }
      }

      printer.text('-'.repeat(32));
      printer.style('B');
      if (order.shipping > 0) {
        printer.text(formatLine('Envío', fmtPrice(order.shipping)));
      }
      printer.text(formatLine('TOTAL', fmtPrice(order.total)));
      printer.style('NORMAL');
      printer.text('-'.repeat(32)).text('');

      if (order.address) printer.text(formatLine('Dir:', order.address));
      if (order.customerName) printer.text(formatLine('Nom:', order.customerName));
      printer.text(formatLine('Pago:', order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'));
      
      printer
        .text('')
        .align('CT')
        .text('Gracias por su compra.')
        .feed(4)
        .close();
      
      resolve();
    });
  });
}

// Fallback visual logger if no USB printer is connected
function simulatePrint(order: PrintOrderPayload) {
  const grouped = groupOrderItems(order.items);
  console.log('\n================================');
  console.log('       --- COMANDA ---');
  console.log(`Ticket: ${order.ticketId}`);
  if (order.deliveryPersonName) console.log(`Repartidor: ${order.deliveryPersonName}`);
  console.log('--------------------------------');
  for (const item of grouped) {
    console.log(`${item.qty}x ${item.name}`);
    for (const ext of item.extras) console.log(`   + ${ext.name}`);
  }
  console.log('\n--------------------------------');
  console.log('         (CORTAR AQUI)');
  console.log('--------------------------------\n');
  console.log('        THE BEST BURGERS');
  console.log('');
  for (const item of grouped) {
    console.log(formatLine(`${item.qty}x ${item.name}`, fmtPrice(item.price)));
    if (item.isPromo && item.promoDiscount > 0) console.log(formatLine(` >> Promo`, `-${fmtPrice(item.promoDiscount)}`));
    for (const ext of item.extras) console.log(formatLine(`   + ${ext.name}`, fmtPrice(ext.price * item.qty)));
  }
  console.log('--------------------------------');
  if (order.shipping > 0) console.log(formatLine('Envío', fmtPrice(order.shipping)));
  console.log(formatLine('TOTAL', fmtPrice(order.total)));
  console.log('--------------------------------');
  if (order.address) console.log(formatLine('Dir:', order.address));
  if (order.customerName) console.log(formatLine('Nom:', order.customerName));
  console.log(formatLine('Pago:', order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'));
  console.log('\n     Gracias por su compra.');
  console.log('================================\n');
}
