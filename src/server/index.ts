import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { printOrder } from './printerService.js';

const prisma = new PrismaClient();
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: 1 } });
  if (user?.password === password) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid PIN' });
  }
});

app.put('/api/auth/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: 1 } });
  if (user?.password === currentPassword) {
    await prisma.user.update({
      where: { id: 1 },
      data: { password: newPassword },
    });
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Invalid current PIN' });
  }
});

// Products & Prices
app.get('/api/products', async (req, res) => {
  const products = await prisma.productPrice.findMany();
  res.json(products);
});

app.put('/api/products', async (req, res) => {
  const { prices } = req.body; // { 'cheese-s': 8000, ... }
  for (const [id, price] of Object.entries(prices)) {
    await prisma.productPrice.upsert({
      where: { id },
      update: { price: Number(price) },
      create: { id, price: Number(price) },
    });
  }
  res.json({ success: true });
});

// Promotions
app.get('/api/promotions', async (req, res) => {
  const promos = await prisma.promotion.findMany();
  res.json(promos);
});

app.post('/api/promotions', async (req, res) => {
  const { variantId, discount, active } = req.body;
  const promo = await prisma.promotion.upsert({
    where: { variantId },
    update: { discount: Number(discount), active: Boolean(active) },
    create: { variantId, discount: Number(discount), active: Boolean(active) },
  });
  res.json(promo);
});

app.put('/api/promotions/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const promo = await prisma.promotion.findUnique({ where: { variantId: id } });
  if (promo) {
    await prisma.promotion.update({
      where: { variantId: id },
      data: { active: !promo.active },
    });
  }
  res.json({ success: true });
});

app.delete('/api/promotions/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.promotion.delete({ where: { variantId: id } });
  res.json({ success: true });
});

// Orders
app.get('/api/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const { ticketId, customerName, address, paymentMethod, status, total, shipping, items } = req.body;
  
  const order = await prisma.order.create({
    data: {
      ticketId,
      customerName,
      address,
      paymentMethod,
      status,
      total,
      shipping,
      items: {
        create: items.map((i: any) => ({
          variantId: i.variantId,
          label: i.label,
          isPromo: i.isPromo,
          price: i.price,
          extrasJson: JSON.stringify(i.extras || []),
        }))
      }
    },
    include: { items: true }
  });
  
  res.json(order);
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true }
  });
  res.json(order);
});

// Printing
app.post('/api/print', async (req, res) => {
  try {
    await printOrder(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('[Printer Route] Error al imprimir:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
