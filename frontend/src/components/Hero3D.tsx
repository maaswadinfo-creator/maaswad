import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';

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
        initial={{ opacity: 0, y: 20, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-burgundy-700 via-burgundy-600 to-brand-600 px-5 py-4 text-white shadow-lift sm:px-6 sm:py-5"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_88%_15%,rgba(216,153,58,.45),transparent_55%)]" />
        <motion.div className="pointer-events-none absolute -inset-x-10 -top-16 h-32 rotate-12 bg-white/15 blur-2xl"
          animate={{ x: ['-20%', '120%'] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />

        {FLOATERS.map((f, i) => <Floater key={i} f={f} i={i} mx={mx} my={my} />)}

        <div style={{ transform: 'translateZ(50px)' }} className="relative flex max-w-md items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold leading-tight sm:text-2xl">Homemade food, near you</h2>
            <p className="mt-1 text-xs text-white/85">Verified chefs · made with love</p>
          </div>
          <Link to="/search" className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-burgundy-700 shadow-soft transition hover:scale-105 active:scale-95">
            Explore
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
