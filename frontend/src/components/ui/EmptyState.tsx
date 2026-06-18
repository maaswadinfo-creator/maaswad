import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export function EmptyState({ emoji = '🍽️', title, subtitle, action }: {
  emoji?: string; title: string; subtitle?: string; action?: ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="card flex flex-col items-center gap-3 p-10 text-center">
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="text-5xl">{emoji}</motion.div>
      <p className="font-semibold">{title}</p>
      {subtitle && <p className="max-w-xs text-sm text-slate-400">{subtitle}</p>}
      {action}
    </motion.div>
  );
}
