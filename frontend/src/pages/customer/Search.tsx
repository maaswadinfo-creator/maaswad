import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { DishCard } from '@/components/DishCard';
import { PageLoader } from '@/components/ui/Spinner';
import type { Dish } from '@/types';

const FOOD_TYPES = [['', 'All'], ['veg', 'Veg'], ['non_veg', 'Non-veg'], ['vegan', 'Vegan']];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('search') || '');
  const foodType = params.get('foodType') || '';
  const category = params.get('category') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['search', params.toString()],
    queryFn: async () => (await api.get(`/catalog/dishes?${params.toString()}`)).data.data as Dish[],
  });

  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    v ? next.set(k, v) : next.delete(k);
    setParams(next);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search dishes, cuisines..." value={q}
            onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && update('search', q)} />
        </div>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FOOD_TYPES.map(([v, l]) => (
          <button key={v} onClick={() => update('foodType', v)}
            className={`badge whitespace-nowrap px-3 py-1.5 border ${foodType === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200'}`}>{l}</button>
        ))}
      </div>
      {category && <p className="mb-3 text-sm text-slate-500">Category: <b>{category}</b></p>}
      {isLoading ? <PageLoader /> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data?.map((d) => <DishCard key={d._id} dish={d} />)}
          {!data?.length && <p className="col-span-full text-center text-slate-400">No results.</p>}
        </div>
      )}
    </div>
  );
}
