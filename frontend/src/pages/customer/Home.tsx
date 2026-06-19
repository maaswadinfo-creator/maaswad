import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Gift, ShieldCheck, ChefHat, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { DishCard } from '@/components/DishCard';
import { DishGridSkeleton } from '@/components/ui/Skeleton';
import { Hero3D } from '@/components/Hero3D';
import { Reveal } from '@/components/motion/Reveal';
import { stagger, fadeUp } from '@/lib/motion';
import type { Dish } from '@/types';

const CATEGORIES = [
  { label: 'Vegetarian', e: '🥗' }, { label: 'Traditional Foods', e: '🍲' },
  { label: 'Festival Foods', e: '🪔' }, { label: 'Healthy Foods', e: '🥦' },
  { label: 'Kids Special', e: '🧒' }, { label: 'Protein Rich', e: '💪' },
  { label: 'Millet Foods', e: '🌾' }, { label: 'Biryani', e: '🍛' },
];

type Filter = 'all' | 'veg' | 'non_veg';

export default function CustomerHome() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading } = useQuery({
    queryKey: ['dishes', 'home'],
    queryFn: async () => (await api.get('/catalog/dishes?limit=16')).data.data as Dish[],
  });

  const dishes = (data || []).filter((d) =>
    filter === 'all' ? true : filter === 'veg' ? d.foodType === 'veg' || d.foodType === 'vegan' : d.foodType === 'non_veg' || d.foodType === 'egg'
  );

  return (
    <div className="space-y-6">
      <Hero3D />

      {/* super filter: veg / non-veg */}
      <div className="flex items-center gap-2">
        {([
          { v: 'all', label: 'All', dot: 'bg-charcoal-400' },
          { v: 'veg', label: 'Pure Veg', dot: 'bg-green-600' },
          { v: 'non_veg', label: 'Non-Veg', dot: 'bg-red-600' },
        ] as const).map((o) => (
          <button key={o.v} onClick={() => setFilter(o.v)}
            className={`relative flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              filter === o.v ? 'border-transparent text-white' : 'border-black/10 bg-white text-charcoal-700 dark:border-white/10 dark:bg-charcoal-900 dark:text-stone-200'
            }`}>
            {filter === o.v && <motion.span layoutId="filterpill" transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute inset-0 -z-10 rounded-full bg-gradient-to-b from-brand-500 to-brand-600" />}
            <span className={`h-2 w-2 rounded-full ${o.dot} ${filter === o.v ? 'ring-2 ring-white/60' : ''}`} />
            {o.label}
          </button>
        ))}
      </div>

      {/* small category circles */}
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link to={`/search?category=${encodeURIComponent(c.label)}`} className="flex w-16 flex-col items-center gap-1.5">
              <motion.span whileTap={{ scale: 0.9 }} whileHover={{ y: -3 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-soft dark:bg-charcoal-900">{c.e}</motion.span>
              <span className="text-center text-[11px] font-medium leading-tight text-charcoal-700 dark:text-stone-300">{c.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* compact highlight strip */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 text-xs">
        {[
          { icon: Truck, t: 'Free delivery over ₹1000' },
          { icon: Gift, t: 'Refer & earn credits' },
          { icon: ShieldCheck, t: 'Hygiene-verified kitchens' },
        ].map((p) => (
          <span key={p.t} className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 font-medium text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
            <p.icon className="h-3.5 w-3.5" />{p.t}
          </span>
        ))}
      </div>

      {/* dishes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Popular dishes</h3>
          <Link to="/search" className="text-sm font-medium text-brand-600">See all</Link>
        </div>
        {isLoading ? (
          <DishGridSkeleton count={8} />
        ) : dishes.length ? (
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {dishes.map((d) => <DishCard key={d._id} dish={d} />)}
          </motion.div>
        ) : (
          <div className="card flex flex-col items-center gap-2 p-8 text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl">🍽️</motion.div>
            <p className="font-semibold">{data?.length ? 'No dishes match this filter' : 'Fresh dishes coming soon'}</p>
            <p className="max-w-sm text-sm text-stone-400">{data?.length ? 'Try a different filter or category.' : 'Our home chefs are getting their kitchens ready.'}</p>
          </div>
        )}
      </section>

      {/* Become a Chef banner */}
      <Reveal>
        <Link to="/become-chef">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-burgundy-700 p-5 text-white shadow-lg"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-80">Join Us</div>
                <h3 className="text-lg font-bold">Love to cook? Become a Chef</h3>
                <p className="mt-1 max-w-xs text-sm opacity-80">
                  Share your home-cooked recipes with thousands of food lovers and earn from your kitchen.
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 ml-4 shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold opacity-90">Apply <ArrowRight className="h-3 w-3" /></span>
              </div>
            </div>
            {/* decorative blobs */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 left-1/3 h-16 w-16 rounded-full bg-white/5" />
          </motion.div>
        </Link>
      </Reveal>

      {/* founder */}
      <Reveal>
        <div className="card flex items-center gap-4 p-4">
          <img src="/founder.jpg" alt="Dr. Chef Vinoth Kumar" className="h-14 w-14 rounded-full object-cover ring-4 ring-brand-100 dark:ring-brand-900/40" />
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">An initiative by</div>
            <p className="font-bold">Dr. Chef Vinoth Kumar</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
