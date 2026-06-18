import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, User, Search, Home, Receipt, LogOut } from 'lucide-react';
import { useCart } from '@/context/cartStore';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PageWrap } from '@/components/motion/PageWrap';
import { InstallPrompt } from '@/components/InstallPrompt';

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/orders', icon: Receipt, label: 'Orders' },
  { to: '/account', icon: User, label: 'Account' },
];

export function CustomerLayout() {
  const count = useCart((s) => s.count());
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <div className="min-h-screen pb-24">
      {/* slim, strong header */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-cream/80 backdrop-blur-xl dark:border-white/5 dark:bg-charcoal-950/70">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-2">
          <Logo iconClassName="h-12 w-12" />
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link to="/cart" className="relative btn-ghost !px-2.5">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <motion.span key={count} initial={{ scale: 0.4, y: -4 }} animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-burgundy-600 px-1 text-[10px] font-bold text-white">{count}</motion.span>
              )}
            </Link>
            {user ? (
              <button onClick={() => { logout(); nav('/'); }} className="btn-ghost !px-2.5"><LogOut className="h-5 w-5" /></button>
            ) : (
              <Link to="/login" className="btn-primary !py-2">Login</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <PageWrap key={loc.pathname}><Outlet /></PageWrap>
      </main>

      <InstallPrompt />

      {/* glassmorphism floating bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around rounded-3xl border border-white/40 bg-white/60 p-1.5 shadow-lift backdrop-blur-2xl dark:border-white/10 dark:bg-charcoal-900/60">
          {NAV.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} className="relative flex-1">
              {({ isActive }) => (
                <motion.span whileTap={{ scale: 0.88 }}
                  className={`relative flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition-colors ${isActive ? 'text-white' : 'text-charcoal-700 dark:text-stone-300'}`}>
                  {isActive && (
                    <motion.span layoutId="navpill" transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-b from-brand-500 to-brand-600 shadow-soft" />
                  )}
                  <i.icon className="h-5 w-5" />
                  {i.label}
                </motion.span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
