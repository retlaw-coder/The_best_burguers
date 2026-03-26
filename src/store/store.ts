import { create } from 'zustand';
import { MENU } from '../constants/menu';

export type BurgerData = { id: string; name: string; desc: string; variants: { id: string; name: string; price: number }[] };
export type BeverageData = { id: string; name: string; variants: { id: string; name: string; price: number }[] };
export type ExtraData = { id: string; name: string; price: number };
export type DeliveryPerson = { id: string; name: string };
export type CheckoutInfo = { deliveryType: 'DELIVERY' | 'TAKE_AWAY'; address: string; name: string; shipping: number | null; payment: 'CASH' | 'TRANSFER'; deliveryPersonId: string | null };
export type WizardState = { step: number; burgerId: string | null; beverageId: string | null; burgerVariantId: string | null; beverageVariantId: string | null; extras: string[]; editingIndex?: number; burgerIsPromo?: boolean; qty: number; };
export type SlotItem = { variantId: string; extras: string[]; isPromo?: boolean; };
export type SlotState = { id: number; state: 'empty' | 'active' | 'pending'; ticketId?: string; items: SlotItem[]; wizard: WizardState | null; checkout: CheckoutInfo; pendingPayment: boolean; _confirmCancel?: boolean; _confirmCancelPending?: boolean; };
export type OrderStatus = 'PREPARING' | 'SENT' | 'COMPLETED';
export type OrderData = { id: string; ticketId: string; name: string; address: string; shipping: number; payment: 'CASH' | 'TRANSFER'; items: SlotItem[]; total: number; status: OrderStatus; createdAt: string; expanded: boolean; deliveryPersonId?: string | null; deliveryPersonName?: string | null };
export type ProductPrice = { id: string; price: number };
export type PromoData = { variantId: string; discount: number; active: boolean };

interface AppState {
  slots: SlotState[];
  orders: OrderData[];
  prices: Record<string, number>;
  promos: Record<string, PromoData>;
  cajaUnlocked: boolean;
  modal: { title: string, content: string } | null;
  menuBurgers: BurgerData[];
  menuBeverages: BeverageData[];
  menuExtras: ExtraData[];
  deliveries: DeliveryPerson[];
  
  // Setters
  setPrices: (prices: Record<string, number>) => void;
  setPromos: (promos: Record<string, PromoData>) => void;
  setOrders: (orders: OrderData[]) => void;
  updateSlot: (id: number, data: Partial<SlotState>) => void;
  setCajaUnlocked: (val: boolean) => void;
  openModal: (title: string, content: string) => void;
  closeModal: () => void;
  
  // Slot Actions
  activateSlot: (id: number) => void;
  resetSlot: (id: number) => void;
  addEmptySlotIfNeeded: () => void;
  
  // CRUD Burgers
  addBurger: (name: string, desc: string, priceS: number, priceD: number, priceT: number) => void;
  removeBurger: (id: string) => void;

  // CRUD Beverages
  addBeverage: (name: string, price: number) => void;
  removeBeverage: (id: string) => void;

  // CRUD Extras
  addExtra: (name: string, price: number) => void;
  removeExtra: (id: string) => void;
  
  // CRUD Deliveries
  addDelivery: (name: string) => void;
  removeDelivery: (id: string) => void;
  
  // Order actions
  deleteOrder: (id: string) => void;
  
  // API helpers
  fetchPricesAndPromos: () => Promise<void>;
  fetchOrders: () => Promise<void>;
}

const loadMenuBurgers = (): BurgerData[] => {
  const local = localStorage.getItem('__best_burgers_menu_burgers');
  return local ? JSON.parse(local) : [...MENU.burgers];
};

const loadMenuBeverages = (): BeverageData[] => {
  const local = localStorage.getItem('__best_burgers_menu_beverages');
  return local ? JSON.parse(local) : [...MENU.beverages];
};

const loadMenuExtras = (): ExtraData[] => {
  const local = localStorage.getItem('__best_burgers_menu_extras');
  return local ? JSON.parse(local) : [...MENU.extras];
};

const loadDeliveries = (): DeliveryPerson[] => {
  const local = localStorage.getItem('__best_burgers_deliveries');
  return local ? JSON.parse(local) : [];
};

export const useStore = create<AppState>((set, get) => ({
  slots: [
    { id: 1, state: 'empty', items: [], wizard: null, checkout: { deliveryType: 'DELIVERY', address:'', name:'', shipping: null, payment: 'CASH', deliveryPersonId: null }, pendingPayment: false },
    { id: 2, state: 'empty', items: [], wizard: null, checkout: { deliveryType: 'DELIVERY', address:'', name:'', shipping: null, payment: 'CASH', deliveryPersonId: null }, pendingPayment: false },
    { id: 3, state: 'empty', items: [], wizard: null, checkout: { deliveryType: 'DELIVERY', address:'', name:'', shipping: null, payment: 'CASH', deliveryPersonId: null }, pendingPayment: false }
  ],
  orders: [],
  prices: {},
  promos: {},
  cajaUnlocked: false,
  modal: null,
  menuBurgers: loadMenuBurgers(),
  menuBeverages: loadMenuBeverages(),
  menuExtras: loadMenuExtras(),
  deliveries: loadDeliveries(),

  setPrices: (prices) => set({ prices }),
  setPromos: (promos) => set({ promos }),
  setOrders: (orders) => set({ orders }),
  setCajaUnlocked: (val) => set({ cajaUnlocked: val }),
  openModal: (title, content) => set({ modal: { title, content } }),
  closeModal: () => set({ modal: null }),

  updateSlot: (id, data) => set(state => ({
    slots: state.slots.map(s => s.id === id ? { ...s, ...data } : s)
  })),

  activateSlot: (id) => {
    get().updateSlot(id, {
      state: 'active',
      wizard: { step: 0, burgerId: null, beverageId: null, burgerVariantId: null, beverageVariantId: null, extras: [], qty: 1 }
    });
    get().addEmptySlotIfNeeded();
  },

  resetSlot: (id) => {
    set(state => {
      const idx = state.slots.findIndex(s => s.id === id);
      if (idx === -1) return state;
      let newSlots = [...state.slots];
      if (id > 3) {
        newSlots.splice(idx, 1);
      } else {
        newSlots[idx] = { id, state: 'empty', items: [], wizard: null, checkout: { deliveryType: 'DELIVERY', address:'', name:'', shipping: null, payment: 'CASH', deliveryPersonId: null }, pendingPayment: false };
      }
      return { slots: newSlots };
    });
    get().addEmptySlotIfNeeded();
  },

  addEmptySlotIfNeeded: () => {
    set(state => {
      if (!state.slots.some(s => s.state === 'empty')) {
        const nextId = Math.max(...state.slots.map(s => s.id)) + 1;
        return { slots: [...state.slots, { id: nextId, state: 'empty', items: [], wizard: null, checkout: { deliveryType: 'DELIVERY', address:'', name:'', shipping: null, payment: 'CASH', deliveryPersonId: null }, pendingPayment: false }] };
      }
      return state;
    });
  },

  // ── CRUD Burgers ───────────────────────────────
  addBurger: (name, desc, priceS, priceD, priceT) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newBurger: BurgerData = {
      id: slug,
      name,
      desc,
      variants: [
        { id: `${slug}-s`, name: 'Simple', price: priceS },
        { id: `${slug}-d`, name: 'Doble', price: priceD },
        { id: `${slug}-t`, name: 'Triple', price: priceT },
      ]
    };
    set(state => {
      const newBurgers = [...state.menuBurgers, newBurger];
      localStorage.setItem('__best_burgers_menu_burgers', JSON.stringify(newBurgers));
      // Also update prices map
      const newPrices = { ...state.prices };
      newBurger.variants.forEach(v => { newPrices[v.id] = v.price; });
      localStorage.setItem('__best_burgers_prices', JSON.stringify(newPrices));
      return { menuBurgers: newBurgers, prices: newPrices };
    });
  },

  removeBurger: (id) => {
    set(state => {
      const burger = state.menuBurgers.find(b => b.id === id);
      const newBurgers = state.menuBurgers.filter(b => b.id !== id);
      localStorage.setItem('__best_burgers_menu_burgers', JSON.stringify(newBurgers));
      // Remove prices for variants
      if (burger) {
        const newPrices = { ...state.prices };
        burger.variants.forEach(v => { delete newPrices[v.id]; });
        localStorage.setItem('__best_burgers_prices', JSON.stringify(newPrices));
        return { menuBurgers: newBurgers, prices: newPrices };
      }
      return { menuBurgers: newBurgers };
    });
  },

  // ── CRUD Beverages ──────────────────────────────
  addBeverage: (name, price) => {
    const slug = 'bev-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newBeverage: BeverageData = {
      id: slug,
      name,
      variants: [{ id: `${slug}-u`, name: 'Unidad', price }]
    };
    set(state => {
      const newBeverages = [...state.menuBeverages, newBeverage];
      localStorage.setItem('__best_burgers_menu_beverages', JSON.stringify(newBeverages));
      const newPrices = { ...state.prices, [`${slug}-u`]: price };
      localStorage.setItem('__best_burgers_prices', JSON.stringify(newPrices));
      return { menuBeverages: newBeverages, prices: newPrices };
    });
  },

  removeBeverage: (id) => {
    set(state => {
      const bev = state.menuBeverages.find(b => b.id === id);
      const newBeverages = state.menuBeverages.filter(b => b.id !== id);
      localStorage.setItem('__best_burgers_menu_beverages', JSON.stringify(newBeverages));
      if (bev) {
        const newPrices = { ...state.prices };
        bev.variants.forEach(v => { delete newPrices[v.id]; });
        localStorage.setItem('__best_burgers_prices', JSON.stringify(newPrices));
        return { menuBeverages: newBeverages, prices: newPrices };
      }
      return { menuBeverages: newBeverages };
    });
  },

  // ── CRUD Extras ───────────────────────────────
  addExtra: (name, price) => {
    const slug = 'ex-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newExtra: ExtraData = { id: slug, name, price };
    set(state => {
      const newExtras = [...state.menuExtras, newExtra];
      localStorage.setItem('__best_burgers_menu_extras', JSON.stringify(newExtras));
      const newPrices = { ...state.prices, [slug]: price };
      localStorage.setItem('__best_burgers_prices', JSON.stringify(newPrices));
      return { menuExtras: newExtras, prices: newPrices };
    });
  },

  removeExtra: (id) => {
    set(state => {
      const newExtras = state.menuExtras.filter(e => e.id !== id);
      localStorage.setItem('__best_burgers_menu_extras', JSON.stringify(newExtras));
      const newPrices = { ...state.prices };
      delete newPrices[id];
      localStorage.setItem('__best_burgers_prices', JSON.stringify(newPrices));
      return { menuExtras: newExtras, prices: newPrices };
    });
  },

  // ── CRUD Deliveries ───────────────────────────
  addDelivery: (name) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newDelivery: DeliveryPerson = { id, name };
    set(state => {
      const newDeliveries = [...state.deliveries, newDelivery];
      localStorage.setItem('__best_burgers_deliveries', JSON.stringify(newDeliveries));
      return { deliveries: newDeliveries };
    });
  },

  removeDelivery: (id) => {
    set(state => {
      const newDeliveries = state.deliveries.filter(d => d.id !== id);
      localStorage.setItem('__best_burgers_deliveries', JSON.stringify(newDeliveries));
      return { deliveries: newDeliveries };
    });
  },

  // ── Delete Order ───────────────────────────────
  deleteOrder: (id) => {
    set(state => {
      const newOrders = state.orders.filter(o => o.id !== id);
      const localO = localStorage.getItem('__best_burgers_orders');
      if (localO) {
        const arr = JSON.parse(localO).filter((o: any) => o.id !== id);
        localStorage.setItem('__best_burgers_orders', JSON.stringify(arr));
      }
      return { orders: newOrders };
    });
    // Also try backend
    fetch(`/api/orders/${id}`, { method: 'DELETE' }).catch(() => {});
  },

  fetchPricesAndPromos: async () => {
    try {
      const [res1, res2] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/promotions').then(r => r.json())
      ]);
      const pmap: Record<string, number> = {};
      res1.forEach((p: any) => pmap[p.id] = p.price);
      
      const promomap: Record<string, PromoData> = {};
      res2.forEach((p: any) => promomap[p.variantId] = p);

      set({ prices: pmap, promos: promomap });
    } catch (e) {
      console.warn('Backend unavailable, using fallback for prices/promos');
      const state = get();
      const pmap: Record<string, number> = {};
      // Use reactive menu data
      state.menuBurgers.forEach(b => b.variants.forEach(v => pmap[v.id] = v.price));
      state.menuBeverages.forEach(b => b.variants.forEach(v => pmap[v.id] = v.price));
      state.menuExtras.forEach(e => pmap[e.id] = e.price);
      
      // Attempt to load from localStorage
      const localP = localStorage.getItem('__best_burgers_prices');
      if (localP) Object.assign(pmap, JSON.parse(localP));

      const localPr = localStorage.getItem('__best_burgers_promos');
      const promomap: Record<string, PromoData> = localPr ? JSON.parse(localPr) : {};
      if (Object.keys(promomap).length === 0) {
        const standardBurger = state.menuBurgers.find(b => b.name === 'Classic')?.variants.find(v => v.name === 'Simple');
        if (standardBurger) {
          promomap[standardBurger.id] = { variantId: standardBurger.id, discount: 1500, active: true };
        }
      }

      set({ prices: pmap, promos: promomap });
    }
  },

  fetchOrders: async () => {
    try {
      const res = await fetch('/api/orders').then(r => r.json());
      set({ orders: res.map((o: any) => ({ ...o, expanded: false })) });
    } catch (e) {
      console.warn('Backend unavailable, using fallback for orders');
      const localO = localStorage.getItem('__best_burgers_orders');
      if (localO) {
        set({ orders: JSON.parse(localO) });
      }
    }
  }
}));
