import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, HeartHandshake, Soup } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { fadeUp, stagger } from '@/lib/motion';

const FOODS = ['🍛', '🥘', '🫓', '🍚', '🥗', '🍢'];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-brand-50 to-white dark:from-ink-950 dark:to-ink-900">
      {/* animated gradient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-900/20 animate-float" />
        <div className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-900/10 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* floating food emojis */}
      {FOODS.map((f, i) => (
        <motion.div key={i} className="pointer-events-none absolute hidden text-4xl opacity-70 md:block"
          style={{ left: `${8 + i * 15}%`, top: `${15 + (i % 3) * 22}%` }}
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}>
          {f}
        </motion.div>
      ))}

      <div className="relative mx-auto max-w-4xl px-6 py-16 text-center">
        <motion.img variants={fadeUp} initial="hidden" animate="show"
          src="/logo.png" alt="Maaswad — Home Food, Made with Mother's Love" className="mx-auto h-48 w-auto drop-shadow-sm" />
        <motion.p variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}
          className="mt-3 text-xl font-medium text-slate-600 dark:text-slate-300">Home Food, Made with Mother's Love</motion.p>
        <motion.p variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}
          className="mx-auto mt-5 max-w-2xl text-slate-500 dark:text-slate-400">
          Authentic, hygienic, homemade Indian food from verified home chefs near you —
          empowering local home cooks and preserving traditional recipes.
        </motion.p>
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}
          className="mt-9 flex justify-center gap-3">
          <Link to="/" className="btn-primary animate-pulse-ring rounded-full px-7 py-3 text-base">Order Food</Link>
          <Link to="/become-chef" className="btn-outline rounded-full px-7 py-3 text-base">Become a Home Chef</Link>
        </motion.div>
      </div>

      {/* value props */}
      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        className="relative mx-auto grid max-w-4xl gap-4 px-6 pb-6 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, t: 'Verified Home Chefs', d: 'Every kitchen is reviewed for hygiene and quality.' },
          { icon: Soup, t: 'Authentic Recipes', d: 'Regional, traditional dishes from across India.' },
          { icon: HeartHandshake, t: 'Made with Love', d: 'Real people cooking real food, just like home.' },
        ].map((v) => (
          <motion.div key={v.t} variants={fadeUp} className="card p-5 text-left">
            <div className="mb-3 inline-flex rounded-xl bg-brand-100 p-2.5 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300"><v.icon className="h-5 w-5" /></div>
            <h3 className="font-semibold">{v.t}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{v.d}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* founder */}
      <div className="relative mx-auto max-w-3xl px-6 py-12">
        <Reveal>
          <div className="card flex flex-col items-center gap-5 p-7 text-center sm:flex-row sm:text-left">
            <img src="/founder.jpg" alt="Dr. Chef Vinoth Kumar" className="h-28 w-28 flex-shrink-0 rounded-full object-cover ring-4 ring-brand-100 dark:ring-brand-900/40" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">An initiative by</div>
              <h2 className="text-2xl font-bold">Dr. Chef Vinoth Kumar</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Maaswad is the vision of Dr. Chef Vinoth Kumar — a mission to connect verified home
                chefs with food lovers, enable local entrepreneurship, and preserve the authentic
                taste of traditional Indian home cooking, made with a mother's love.
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      <p className="relative pb-10 text-center text-xs text-slate-400">Maaswad — An initiative by Dr. Chef Vinoth Kumar</p>
    </div>
  );
}
