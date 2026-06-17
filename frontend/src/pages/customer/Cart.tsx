import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCart } from '@/context/cartStore';
import { inr } from '@/lib/cn';

export default function Cart() {
  const { items, setQty, remove } = useCart();
  const nav = useNavigate();
  const subtotal = items.reduce((s, i) => s + i.dish.displayedPrice * i.qty, 0);

  if (!items.length) return (
    <div className="py-20 text-center">
      <p className="text-slate-400">Your cart is empty.</p>
      <Link to="/" className="btn-primary mt-4 inline-flex">Browse food</Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-bold">Your Cart</h1>
      <div className="space-y-3">
        {items.map(({ dish, qty }) => (
          <div key={dish._id} className="card flex items-center gap-3 p-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-100 text-2xl">🍲</div>
            <div className="flex-1">
              <p className="font-semibold leading-tight">{dish.name}</p>
              <p className="text-sm text-brand-700">{inr(dish.displayedPrice)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(dish._id, qty - 1)} className="btn-ghost !p-1.5"><Minus className="h-4 w-4" /></button>
              <span className="w-5 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(dish._id, qty + 1)} className="btn-ghost !p-1.5"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={() => remove(dish._id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <div className="card mt-4 p-4">
        <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-semibold">{inr(subtotal)}</span></div>
        <p className="mt-1 text-xs text-slate-400">Taxes, packing & delivery calculated at checkout.</p>
        <button onClick={() => nav('/checkout')} className="btn-primary mt-4 w-full">Proceed to Checkout</button>
      </div>
    </div>
  );
}
