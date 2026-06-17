import { create } from 'zustand';
import type { Dish } from '@/types';

interface CartState {
  items: { dish: Dish; qty: number }[];
  add: (dish: Dish) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  chefId: () => string | null;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (dish) => set((s) => {
    const chef = typeof dish.chef === 'string' ? dish.chef : dish.chef._id;
    const currentChef = s.items[0] ? (typeof s.items[0].dish.chef === 'string' ? s.items[0].dish.chef : s.items[0].dish.chef._id) : null;
    // single-chef cart rule
    const base = currentChef && currentChef !== chef ? [] : s.items;
    const existing = base.find((i) => i.dish._id === dish._id);
    if (existing) return { items: base.map((i) => i.dish._id === dish._id ? { ...i, qty: i.qty + 1 } : i) };
    return { items: [...base, { dish, qty: 1 }] };
  }),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.dish._id !== id) })),
  setQty: (id, qty) => set((s) => ({ items: qty <= 0 ? s.items.filter((i) => i.dish._id !== id) : s.items.map((i) => i.dish._id === id ? { ...i, qty } : i) })),
  clear: () => set({ items: [] }),
  count: () => get().items.reduce((n, i) => n + i.qty, 0),
  chefId: () => {
    const f = get().items[0];
    if (!f) return null;
    return typeof f.dish.chef === 'string' ? f.dish.chef : f.dish.chef._id;
  },
}));
