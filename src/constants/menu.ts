import { ExtraData } from '../store/store';
import { useStore } from '../store/store';

export const MENU = {
  burgers: [
    { id: 'cheese', name: 'Cheese', desc: 'Pan, carne, cheddar', variants: [
      { id: 'cheese-s', name: 'Simple', price: 7400 },
      { id: 'cheese-d', name: 'Doble', price: 9900 },
      { id: 'cheese-t', name: 'Triple', price: 11900 }
    ]},
    { id: 'cheese-bacon', name: 'Cheese Bacon', desc: 'Pan, carne, cheddar, bacon', variants: [
      { id: 'cb-s', name: 'Simple', price: 7700 },
      { id: 'cb-d', name: 'Doble', price: 10200 },
      { id: 'cb-t', name: 'Triple', price: 12200 }
    ]},
    { id: 'tasty', name: 'Tasty', desc: 'Pan, salsa tasty, carne, cheddar, lechuga, tomate', variants: [
      { id: 'tasty-s', name: 'Simple', price: 8000 },
      { id: 'tasty-d', name: 'Doble', price: 10500 },
      { id: 'tasty-t', name: 'Triple', price: 12500 }
    ]},
    { id: 'yankee', name: 'Yankee', desc: 'Pan, cebolla caramelizada, carne, cheddar, bacon', variants: [
      { id: 'yankee-s', name: 'Simple', price: 8000 },
      { id: 'yankee-d', name: 'Doble', price: 10500 },
      { id: 'yankee-t', name: 'Triple', price: 12500 }
    ]},
    { id: 'mega', name: 'Mega', desc: 'Pan, ketchup, carne, cheddar, bacon, papas pay', variants: [
      { id: 'mega-s', name: 'Simple', price: 8000 },
      { id: 'mega-d', name: 'Doble', price: 10500 },
      { id: 'mega-t', name: 'Triple', price: 12500 }
    ]}
  ],
  beverages: [
    { id: 'coca', name: 'Coca-Cola', variants: [
      { id: 'coca-15', name: '1.5 Lts', price: 3800 },
      { id: 'coca-05', name: '500cc', price: 2200 }
    ]},
    { id: 'sprite', name: 'Sprite', variants: [
      { id: 'sprite-15', name: '1.5 Lts', price: 3800 },
      { id: 'sprite-05', name: '500cc', price: 2200 }
    ]},
    { id: 'fanta', name: 'Fanta', variants: [
      { id: 'fanta-15', name: '1.5 Lts', price: 3800 },
      { id: 'fanta-05', name: '500cc', price: 2200 }
    ]}
  ],
  extras: [
    { id: 'ex-medallion', name: 'Medallón de carne', price: 2500 },
    { id: 'ex-bacon', name: 'Bacon', price: 1000 },
    { id: 'ex-cheddar', name: 'Extra cheddar', price: 800 },
    { id: 'ex-tomato', name: 'Tomate', price: 500 },
    { id: 'ex-lettuce', name: 'Lechuga', price: 500 },
    { id: 'ex-papas', name: 'Papas pay', price: 500 },
    { id: 'ex-ketchup', name: 'Ketchup', price: 500 },
    { id: 'ex-tasty', name: 'Tasty', price: 500 },
    { id: 'ex-onion', name: 'Cebolla caramelizada', price: 500 },
    { id: 'ex-cono-papas', name: 'Cono de papas', price: 3500 }
  ]
};

export function getVariantById(vid: string) {
  const state = useStore.getState();
  for (const cat of [state.menuBurgers, state.menuBeverages]) {
    for (const p of cat) {
      for (const v of p.variants) {
        if (v.id === vid) return { product: p, variant: v, isBurger: cat === state.menuBurgers };
      }
    }
  }
  return null;
}

export function getExtraById(eid: string): ExtraData | undefined {
  return useStore.getState().menuExtras.find(e => e.id === eid);
}

export function formatThousands(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function fmtPrice(n: number) {
  return '$' + formatThousands(n);
}
