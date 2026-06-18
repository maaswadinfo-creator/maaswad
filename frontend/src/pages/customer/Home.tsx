import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { DishCard } from '@/components/DishCard';
import { DishGridSkeleton } from '@/components/ui/Skeleton';
import { stagger } from '@/lib/motion';
import type { Dish } from '@/types';

const CHIPS = ['Vegetarian', 'Healthy Foods', 'Traditional Foods', 'Festival Foods', 'Kids Special', 'Protein Rich'];

export default function CustomerHome() {
  const { data, isLoading } = useQuery({
    queryKey: ['dishes', 'home'],
    queryFn: async () => (await api.get('/catalog/dishes?limit=24')).data.data as Dish[],
  });

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-amber-500 p-6 text-white shadow-lift">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <h2 className="relative text-2xl font-bold leading-tight">Authentic homemade food, near you</h2>
        <p className="relative mt-1 text-sm text-white/85">Verified home chefs · hygienic kitchens · made with love</p>
        <Link to="/search" className="relative mt-4 inline-flex rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-700 shadow-soft transition hover:scale-105">Explore dishes</Link>
      </motion.div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c, i) => (
          <motion.div key={c} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/search?category=${encodeURIComponent(c)}`}
              className="badge whitespace-nowrap border border-brand-200 bg-white px-3.5 py-1.5 text-brand-700 transition hover:bg-brand-100 dark:border-white/10 dark:bg-ink-900 dark:text-brand-300">{c}</Link>
          </motion.div>
        ))}
      </div>

      <h3 className="mb-3 text-lg font-bold">Popular dishes</h3>
      {isLoading ? (
        <DishGridSkeleton count={8} />
      ) : data?.length ? (
        <motion.div variants={stagger} initial="hidden" animate="show"
          className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {data.map((d) => <DishCard key={d._id} dish={d} />)}
        </motion.div>
      ) : (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <div className="text-5xl">🍽️</div>
          <p className="font-medium">No dishes yet</p>
          <p className="text-sm text-slate-400">Once chefs publish their dishes, they'll appear here.</p>
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-white p-4 text-left shadow-soft dark:bg-ink-900">
        <img src="/founder.jpg" alt="Dr. Chef Vinoth Kumar" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-100 dark:ring-brand-900/40" />
        <div className="text-xs text-slate-500 dark:text-slate-400">
          An initiative by<br /><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dr. Chef Vinoth Kumar</span>
        </div>
      </div>
    </div>
  );
}
