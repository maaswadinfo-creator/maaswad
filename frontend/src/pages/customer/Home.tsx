import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { DishCard } from '@/components/DishCard';
import { DishGridSkeleton } from '@/components/ui/Skeleton';
import { Hero3D } from '@/components/Hero3D';
import { stagger } from '@/lib/motion';
import type { Dish } from '@/types';

const CHIPS = [
  { label: 'Vegetarian', e: '🥗' }, { label: 'Healthy Foods', e: '🥦' },
  { label: 'Traditional Foods', e: '🍲' }, { label: 'Festival Foods', e: '🪔' },
  { label: 'Kids Special', e: '🧒' }, { label: 'Protein Rich', e: '💪' },
];

export default function CustomerHome() {
  const { data, isLoading } = useQuery({
    queryKey: ['dishes', 'home'],
    queryFn: async () => (await api.get('/catalog/dishes?limit=24')).data.data as Dish[],
  });

  return (
    <div>
      <Hero3D />

      <div className="mb-6 flex gap-2.5 overflow-x-auto pb-1">
        {CHIPS.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}>
            <Link to={`/search?category=${encodeURIComponent(c.label)}`}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-200 bg-white px-3.5 py-2 text-sm font-medium text-brand-700 shadow-soft transition hover:bg-brand-50 dark:border-white/10 dark:bg-ink-900 dark:text-brand-300">
              <span className="text-base">{c.e}</span>{c.label}
            </Link>
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
