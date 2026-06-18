import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null); setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md sm:bottom-4">
          <div className="card flex items-center gap-3 p-3 shadow-lift">
            <img src="/pwa-192x192.png" alt="" className="h-11 w-11 rounded-xl" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Install Maaswad</p>
              <p className="text-xs text-slate-400">Add to your home screen for a faster, app-like experience.</p>
            </div>
            <button onClick={install} className="btn-primary !px-3 !py-2 text-xs"><Download className="h-4 w-4" />Install</button>
            <button onClick={() => setShow(false)} aria-label="Dismiss" className="btn-ghost !p-1.5"><X className="h-4 w-4" /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
