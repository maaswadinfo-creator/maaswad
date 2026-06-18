import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { pageTransition } from '@/lib/motion';

export function PageWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} initial={pageTransition.initial} animate={pageTransition.animate}>
      {children}
    </motion.div>
  );
}
