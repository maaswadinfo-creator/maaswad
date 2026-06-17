import { Link } from 'react-router-dom';
import { Star, Clock, Plus } from 'lucide-react';
import { inr } from '@/lib/cn';
import { VegBadge } from '@/components/ui/VegBadge';
import { useCart } from '@/context/cartStore';
import type { Dish } from '@/types';
import toast from 'react-hot-toast';

export function DishCard({ dish }: { dish: Dish }) {
  const add = useCart((s) => s.add);
  const chefName = typeof dish.chef === 'object' ? dish.chef.fullName : '';
  return (
    <div className="card overflow-hidden">
      <Link to={`/dish/${dish._id}`} className="block aspect-[4/3] bg-brand-100">
        {dish.images?.[0]
          ? <img src={dish.images[0]} alt={dish.name} className="h-full w-full object-cover" />
          : <div className="flex h-full items-center justify-center text-4xl">🍲</div>}
      </Link>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <VegBadge type={dish.foodType} />
          <Link to={`/dish/${dish._id}`} className="font-semibold leading-tight line-clamp-1">{dish.name}</Link>
        </div>
        {chefName && <p className="mt-0.5 text-xs text-slate-400">by {chefName}</p>}
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{dish.rating?.avg || 'New'}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dish.preparationTimeMins}m</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold text-brand-700">{inr(dish.displayedPrice)}</span>
          <button onClick={() => { add(dish); toast.success('Added to cart'); }} className="btn-primary !px-3 !py-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Add</button>
        </div>
      </div>
    </div>
  );
}
