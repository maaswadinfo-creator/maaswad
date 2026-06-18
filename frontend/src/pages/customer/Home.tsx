import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Gift, ShieldCheck, UtensilsCrossed, ChefHat, Soup } from 'lucide-react';
import { api } from '@/lib/api';
import { DishCard } from '@/components/DishCard';
import { DishGridSkeleton } from '@/components/ui/Skeleton';
import { Hero3D } from '@/components/Hero3D';
import { Reveal } from '@/components/motion/Reveal';
import { stagger, fadeUp } from '@/lib/motion';
import type { Dish } from '@/types';

const CATEGORIES = [
  { label: 'Vegetarian', e: '🥗', g: 'from-green-400 to-emerald-500' },
  { label: 'Traditional Foods', e: '🍲', g: 'from-orange-400 to-amber-500' },
  { label: 'Festival Foods', e: '🪔', g: 'from-rose-400 to-pink-500' },
  { label: 'Healthy Foods', e: '🥦', g: 'from-lime-400 to-green-500' },
  { label: 'Kids Special', e: '🧒', g: 'from-sky-400 to-blue-500' },
  { label: 'Protein Rich', e: '💪', g: 'from-violet-400 to-purple-500' },
  { label: 'Millet Foods', e: '🌾', g: 'from-yellow-400 to-amber-500' },
  { label: 'Diabetic Friendly', e: '🫛', g: 'from-teal-400 to-cyan-500' },
];

const STEPS = [
  { icon: UtensilsCrossed, t: 'Browse dishes', d: 'Explore home-cooked meals from verified chefs near you.' },
  { icon: ChefHat, t: 'Chef cooks fresh', d: 'Your order is prepared fresh, with hygiene and love.' },
  { icon: Soup, t: 'Delivered hot', d: 'Get authentic homemade food at your doorstep.' },
];

export default function CustomerHome() {
  const { data, isLoading } = useQuery({
    queryKey: ['dishes', 'home'],
    queryFn: async () => (await api.get('/catalog/dishes?limit=12')).data.data as Dish[],
  });

  return (
    <div className="space-y-8">
      <Hero3D />

      {/* promo strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: Truck, t: 'Free delivery', d: 'On orders above ₹1000', g: 'from-brand-500 to-amber-500' },
          { icon: Gift, t: 'Refer & earn', d: 'Invite friends, get credits', g: 'from-rose-500 to-pink-500' },
          { icon: ShieldCheck, t: 'Verified kitchens', d: 'Hygiene-checked home chefs', g: 'from-emerald-500 to-teal-500' },
        ].map((p, i) => (
          <motion.div key={p.t} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${p.g} p-4 text-white shadow-soft`}>
            <p.icon className="h-7 w-7 shrink-0" />
            <div><p className="text-sm font-bold leading-tight">{p.t}</p><p className="text-xs text-white/85">{p.d}</p></div>
          </motion.div>
        ))}
      </div>

      {/* category tiles */}
      <section>
        <h3 className="mb-3 text-lg font-bold">Explore by category</h3>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c) => (
            <motion.div key={c.label} variants={fadeUp} whileHover={{ y: -5, scale: 1.02 }}>
              <Link to={`/search?category=${encodeURIComponent(c.label)}`}
                className={`relative flex h-28 flex-col justify-end overflow-hidden rounded-2xl bg-gradient-to-br ${c.g} p-3 text-white shadow-soft`}>
                <span className="absolute right-2 top-2 text-4xl drop-shadow-md">{c.e}</span>
                <span className="text-sm font-bold leading-tight">{c.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* popular dishes */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">Popular dishes</h3>
          <Link to="/search" className="text-sm font-medium text-brand-600">See all</Link>
        </div>
        {isLoading ? (
          <DishGridSkeleton count={8} />
        ) : data?.length ? (
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {data.map((d) => <DishCard key={d._id} dish={d} />)}
          </motion.div>
        ) : (
          <div className="card flex flex-col items-center gap-2 p-8 text-center">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl">🍽️</motion.div>
            <p className="font-semibold">Fresh dishes coming soon</p>
            <p className="max-w-sm text-sm text-slate-400">Our home chefs are getting their kitchens ready. Browse categories above in the meantime.</p>
          </div>
        )}
      </section>

      {/* how it works */}
      <section>
        <h3 className="mb-3 text-lg font-bold">How Maaswad works</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.1}>
              <div className="card h-full p-5">
                <div className="mb-3 inline-flex rounded-xl bg-brand-100 p-2.5 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"><s.icon className="h-5 w-5" /></div>
                <p className="font-semibold">{i + 1}. {s.t}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* founder */}
      <Reveal>
        <div className="card flex items-center gap-4 p-5">
          <img src="/founder.jpg" alt="Dr. Chef Vinoth Kumar" className="h-16 w-16 rounded-full object-cover ring-4 ring-brand-100 dark:ring-brand-900/40" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">An initiative by</div>
            <p className="text-lg font-bold">Dr. Chef Vinoth Kumar</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Connecting home chefs with food lovers, made with a mother's love.</p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
