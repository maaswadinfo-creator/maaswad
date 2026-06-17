import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Star, Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { inr } from '@/lib/cn';
import { PageLoader } from '@/components/ui/Spinner';
import { VegBadge } from '@/components/ui/VegBadge';
import { useCart } from '@/context/cartStore';
import type { Dish } from '@/types';

export default function DishDetail() {
  const { id } = useParams();
  const add = useCart((s) => s.add);
  const { data, isLoading } = useQuery({
    queryKey: ['dish', id],
    queryFn: async () => (await api.get(`/catalog/dishes/${id}`)).data.data as { dish: Dish; reviews: any[] },
  });
  if (isLoading || !data) return <PageLoader />;
  const { dish, reviews } = data;
  const chef = typeof dish.chef === 'object' ? dish.chef : null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card overflow-hidden">
        <div className="aspect-video bg-brand-100">
          {dish.images?.[0] ? <img src={dish.images[0]} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-6xl">🍲</div>}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2">
            <VegBadge type={dish.foodType} />
            <h1 className="text-2xl font-bold">{dish.name}</h1>
          </div>
          {chef && <Link to={`/`} className="text-sm text-brand-600">by {chef.fullName}</Link>}
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{dish.rating?.avg || 'New'} ({dish.rating?.count || 0})</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{dish.preparationTimeMins} min</span>
          </div>
          <p className="mt-3 text-slate-600">{dish.description}</p>

          {dish.ingredients?.length > 0 && <p className="mt-3 text-sm"><b>Ingredients:</b> {dish.ingredients.join(', ')}</p>}
          {dish.allergens?.length > 0 && <p className="mt-1 text-sm text-red-500"><b>Allergens:</b> {dish.allergens.join(', ')}</p>}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-2xl font-extrabold text-brand-700">{inr(dish.displayedPrice)}</span>
            <button onClick={() => { add(dish); toast.success('Added to cart'); }} className="btn-primary"><Plus className="h-4 w-4" />Add to cart</button>
          </div>
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-lg font-bold">Reviews</h2>
      <div className="space-y-2">
        {reviews?.length ? reviews.map((r) => (
          <div key={r._id} className="card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{r.customer?.name || 'Customer'}</span>
              <span className="flex items-center gap-1 text-xs"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{r.rating}</span>
            </div>
            {r.text && <p className="mt-1 text-sm text-slate-600">{r.text}</p>}
            {r.chefReply?.text && <p className="mt-2 rounded-lg bg-brand-50 p-2 text-xs text-slate-600">Chef: {r.chefReply.text}</p>}
          </div>
        )) : <p className="text-sm text-slate-400">No reviews yet.</p>}
      </div>
    </div>
  );
}
