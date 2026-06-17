import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DishCard } from '@/components/DishCard';
import { PageLoader } from '@/components/ui/Spinner';
import type { Dish } from '@/types';
import { Link } from 'react-router-dom';

const CHIPS = ['Vegetarian', 'Healthy Foods', 'Traditional Foods', 'Festival Foods', 'Kids Special', 'Protein Rich'];

export default function CustomerHome() {
  const { data, isLoading } = useQuery({
    queryKey: ['dishes', 'home'],
    queryFn: async () => (await api.get('/catalog/dishes?limit=24')).data.data as Dish[],
  });

  return (
    <div>
      <div className="card mb-5 bg-gradient-to-r from-brand-600 to-brand-500 p-5 text-white">
        <h2 className="text-xl font-bold">Authentic homemade food, near you</h2>
        <p className="text-sm text-white/80">Verified home chefs · hygienic kitchens · made with love</p>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c) => (
          <Link key={c} to={`/search?category=${encodeURIComponent(c)}`} className="badge whitespace-nowrap border border-brand-200 bg-white px-3 py-1.5 text-brand-700">{c}</Link>
        ))}
      </div>

      <h3 className="mb-3 text-lg font-bold">Popular dishes</h3>
      {isLoading ? <PageLoader /> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data?.map((d) => <DishCard key={d._id} dish={d} />)}
          {!data?.length && <p className="col-span-full text-center text-slate-400">No dishes yet. Run the seed script.</p>}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm">
        <img src="/founder.jpg" alt="Dr. Chef Vinoth Kumar" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-100" />
        <div className="text-xs text-slate-500">
          An initiative by<br /><span className="text-sm font-semibold text-slate-700">Dr. Chef Vinoth Kumar</span>
        </div>
      </div>
    </div>
  );
}
