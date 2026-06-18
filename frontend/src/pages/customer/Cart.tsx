import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/cartStore';
import { inr } from '@/lib/cn';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { EmptyState } from '@/components/ui/EmptyState';

export default function Cart() {
  const { items, setQty, remove } = useCart();
  const nav = useNavigate();
  const subtotal = items.reduce((s, i) => s + i.dish.displayedPrice * i.qty, 0);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState emoji="🛒" title="Your cart is empty"
          subtitle="Browse delicious homemade dishes and add your favourites."
          action={<Link to="/" className="btn-primary mt-2">Browse food</Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold">Your Cart</h1>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map(({ dish, qty }) => (
            <motion.div key={dish._id} layout
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="card flex items-center gap-3 overflow-hidden p-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-2xl dark:bg-white/5">
                {dish.images?.[0] ? <img src={dish.images[0]} className="h-full w-full rounded-xl object-cover" /> : '🍲'}
              </div>
              <div className="flex-1">
                <p className="font-semibold leading-tight">{dish.name}</p>
                <p className="text-sm text-brand-700 dark:text-brand-400">{inr(dish.displayedPrice)}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-slate-200 p-0.5 dark:border-white/10">
                <button onClick={() => setQty(dish._id, qty - 1)} className="btn-ghost !rounded-full !p-1.5"><Minus className="h-4 w-4" /></button>
                <motion.span key={qty} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-5 text-center font-semibold">{qty}</motion.span>
                <button onClick={() => setQty(dish._id, qty + 1)} className="btn-ghost !rounded-full !p-1.5"><Plus className="h-4 w-4" /></button>
              </div>
              <button onClick={() => remove(dish._id)} aria-label="Remove" className="text-red-400 transition hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="card mt-4 p-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-semibold">₹<AnimatedNumber value={subtotal} /></span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Taxes, packing &amp; delivery calculated at checkout.</p>
        <button onClick={() => nav('/checkout')} className="btn-primary mt-4 w-full"><ShoppingBag className="h-4 w-4" />Proceed to Checkout</button>
      </div>
    </div>
  );
}
