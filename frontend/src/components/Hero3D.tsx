import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const FLOATERS = [
  { e: '🍛', x: '6%', y: '18%', z: 90, s: 'text-5xl' },
  { e: '🥘', x: '84%', y: '12%', z: 130, s: 'text-6xl' },
  { e: '🫓', x: '14%', y: '72%', z: 60, s: 'text-4xl' },
  { e: '🍚', x: '90%', y: '66%', z: 110, s: 'text-5xl' },
  { e: '🌶️', x: '72%', y: '82%', z: 70, s: 'text-3xl' },
  { e: '🧅', x: '34%', y: '8%', z: 50, s: 'text-3xl' },
];

function Floater({ f, i, mx, my }: { f: typeof FLOATERS[number]; i: number; mx: MotionValue<number>; my: MotionValue<number> }) {
  const x = useTransform(mx, [-0.5, 0.5], [-f.z / 4, f.z / 4]);
  const y = useTransform(my, [-0.5, 0.5], [-f.z / 6, f.z / 6]);
  return (
    <motion.span
      className={`pointer-events-none absolute hidden drop-shadow-[0_10px_18px_rgba(0,0,0,.25)] sm:block ${f.s}`}
      style={{ left: f.x, top: f.y, x, y, translateZ: f.z }}
      animate={{ translateY: [0, -10, 0] }}
      transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
    >
      {f.e}
    </motion.span>
  );
}

export function Hero3D() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 150, damping: 18 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  return (
    <div className="mb-6" style={{ perspective: 1200 }} onMouseMove={onMove} onMouseLeave={onLeave}>
      <motion.div
        initial={{ opacity: 0, y: 24, rotateX: 12 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-600 via-brand-500 to-amber-400 p-7 text-white shadow-lift sm:p-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(255,255,255,.35),transparent_60%)]" />
        <motion.div className="pointer-events-none absolute -inset-x-10 -top-24 h-48 rotate-12 bg-white/20 blur-2xl"
          animate={{ x: ['-20%', '120%'] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />

        {FLOATERS.map((f, i) => <Floater key={i} f={f} i={i} mx={mx} my={my} />)}

        <div style={{ transform: 'translateZ(60px)' }} className="relative max-w-lg">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> Made with a mother's love
          </span>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">Authentic homemade food, near you</h2>
          <p className="mt-2 text-sm text-white/90 sm:text-base">Verified home chefs · hygienic kitchens · real, traditional recipes</p>
          <Link to="/search" className="mt-5 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-bold text-brand-700 shadow-soft transition hover:scale-105 active:scale-95">
            Explore dishes
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
