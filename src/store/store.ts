import { create } from 'zustand';

export type CheckoutInfo = { address: string; name: string; shipping: number | null; payment: 'CASH' | 'TRANSFER' };
export type WizardState = { step: number; burgerId: string | null; beverageId: string | null; burgerVariantId: string | null; beverageVariantId: string | null; extras: string[]; editingIndex?: number; burgerIsPromo?: boolean; };
export type SlotItem = { variantId: string; extras: string[]; isPromo?: boolean; };
export type SlotState = { id: number; state: 'empty' | 'active' | 'pending'; ticketId?: string; items: SlotItem[]; wizard: WizardState | null; checkout: CheckoutInfo; pendingPayment: boolean; _confirmCancel?: boolean; _confirmCancelPending?: boolean; };
export type OrderStatus = 'PREPARING' | 'SENT' | 'COMPLETED';
export type OrderData = { id: string; ticketId: string; name: string; address: string; shipping: number; payment: 'CASH' | 'TRANSFER'; items: SlotItem[]; total: number; status: OrderStatus; createdAt: string; expanded: boolean; };
export type ProductPrice = { id: string; price: number };
export type PromoData = { variantId: string; discount: number; active: boolean };

interface AppState {
  slots: SlotState[];
  orders: OrderData[];
  prices: Record<string, number>;
  promos: Record<string, PromoData>;
  cajaUnlocked: boolean;
  
  // Setters
  setPrices: (prices: Record<string, number>) => void;
  setPromos: (promos: Record<string, PromoData>) => void;
  setOrders: (orders: OrderData[]) => void;
  updateSlot: (id: number, data: Partial<SlotState>) => void;
  setCajaUnlocked: (val: boolean) => void;
  
  // Slot Actions
  activateSlot: (id: number) => void;
  resetSlot: (id: number) => void;
  addEmptySlotIfNeeded: () => void;
  
  // API helpers
  fetchPricesAndPromos: () => Promise<void>;
  fetchOrders: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  slots: [
    { id: 1, state: 'empty', items: [], wizard: null, checkout: { address:'', name:'', shipping: null, payment: 'CASH' }, pendingPayment: false },
    { id: 2, state: 'empty', items: [], wizard: null, checkout: { address:'', name:'', shipping: null, payment: 'CASH' }, pendingPayment: false },
    { id: 3, state: 'empty', items: [], wizard: null, checkout: { address:'', name:'', shipping: null, payment: 'CASH' }, pendingPayment: false }
  ],
  orders: [],
  prices: {},
  promos: {},
  cajaUnlocked: false,

  setPrices: (prices) => set({ prices }),
  setPromos: (promos) => set({ promos }),
  setOrders: (orders) => set({ orders }),
  setCajaUnlocked: (val) => set({ cajaUnlocked: val }),

  updateSlot: (id, data) => set(state => ({
    slots: state.slots.map(s => s.id === id ? { ...s, ...data } : s)
  })),

  activateSlot: (id) => {
    get().updateSlot(id, {
      state: 'active',
      wizard: { step: 0, burgerId: null, beverageId: null, burgerVariantId: null, beverageVariantId: null, extras: [] }
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
        newSlots[idx] = { id, state: 'empty', items: [], wizard: null, checkout: { address:'', name:'', shipping: null, payment: 'CASH' }, pendingPayment: false };
      }
      return { slots: newSlots };
    });
    get().addEmptySlotIfNeeded();
  },

  addEmptySlotIfNeeded: () => {
    set(state => {
      if (!state.slots.some(s => s.state === 'empty')) {
        const nextId = Math.max(...state.slots.map(s => s.id)) + 1;
        return { slots: [...state.slots, { id: nextId, state: 'empty', items: [], wizard: null, checkout: { address:'', name:'', shipping: null, payment: 'CASH' }, pendingPayment: false }] };
      }
      return state;
    });
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
      import('../constants/menu').then(({ MENU }) => {
        const pmap: Record<string, number> = {};
        [...MENU.burgers, ...MENU.beverages].forEach(p => p.variants.forEach(v => pmap[v.id] = v.price));
        MENU.extras.forEach(e => pmap[e.id] = e.price);
        
        // Attempt to load from localStorage
        const localP = localStorage.getItem('__best_burgers_prices');
        if (localP) Object.assign(pmap, JSON.parse(localP));

        const localPr = localStorage.getItem('__best_burgers_promos');
        const promomap = localPr ? JSON.parse(localPr) : {};

        set({ prices: pmap, promos: promomap });
      });
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
