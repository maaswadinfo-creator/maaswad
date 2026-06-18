import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Skeleton } from '@/components/ui/Skeleton';
import { VegBadge } from '@/components/ui/VegBadge';
import { useCart } from '@/context/cartStore';
import { stagger, fadeUp } from '@/lib/motion';
import type { Dish } from '@/types';

export default function DishDetail() {
  const { id } = useParams();
  const add = useCart((s) => s.add);
  const { data, isLoading } = useQuery({
    queryKey: ['dish', id],
    queryFn: async () => (await api.get(`/catalog/dishes/${id}`)).data.data as { dish: Dish; reviews: any[] },
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  const { dish, reviews } = data;
  const chef = typeof dish.chef === 'object' ? dish.chef : null;

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="card overflow-hidden">
        <div className="aspect-video overflow-hidden bg-brand-100 dark:bg-white/5">
          {dish.images?.[0]
            ? <motion.img src={dish.images[0]} className="h-full w-full object-cover" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 0.7 }} />
            : <div className="flex h-full items-center justify-center text-6xl">🍲</div>}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2">
            <VegBadge type={dish.foodType} />
            <h1 className="text-2xl font-bold">{dish.name}</h1>
          </div>
          {chef && <Link to={`/`} className="text-sm text-brand-600">by {chef.fullName}</Link>}
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{dish.rating?.avg || 'New'} ({dish.rating?.count || 0})</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{dish.preparationTimeMins} min</span>
          </div>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{dish.description}</p>

          {dish.ingredients?.length > 0 && <p className="mt-3 text-sm"><b>Ingredients:</b> {dish.ingredients.join(', ')}</p>}
          {dish.allergens?.length > 0 && <p className="mt-1 text-sm text-red-500"><b>Allergens:</b> {dish.allergens.join(', ')}</p>}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-2xl font-extrabold text-brand-700 dark:text-brand-400">{inr(dish.displayedPrice)}</span>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => { add(dish); toast.success('Added to cart'); }} className="btn-primary"><Plus className="h-4 w-4" />Add to cart</motion.button>
          </div>
        </div>
      </motion.div>

      <h2 className="mb-2 mt-6 text-lg font-bold">Reviews</h2>
      {reviews?.length ? (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
          {reviews.map((r) => (
            <motion.div key={r._id} variants={fadeUp} className="card p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{r.customer?.name || 'Customer'}</span>
                <span className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{r.rating}</span>
              </div>
              {r.text && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{r.text}</p>}
              {r.chefReply?.text && <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">Chef: {r.chefReply.text}</p>}
            </motion.div>
          ))}
        </motion.div>
      ) : <p className="text-sm text-slate-400">No reviews yet. Be the first to review.</p>}
    </div>
  );
}
