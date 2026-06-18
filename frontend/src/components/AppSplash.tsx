import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function AppSplash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-brand-600 via-brand-500 to-amber-400"
          initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            className="rounded-3xl bg-white/95 p-5 shadow-2xl"
          >
            <img src="/logo.png" alt="Maaswad" className="h-28 w-auto" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-5 text-sm font-medium text-white/90">Home Food, Made with Mother's Love</motion.p>
          <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/25">
            <motion.div className="h-full w-1/2 rounded-full bg-white"
              animate={{ x: ['-100%', '250%'] }} transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
