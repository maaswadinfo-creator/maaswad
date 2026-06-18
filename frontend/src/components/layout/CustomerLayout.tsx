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
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 border-b border-brand-100/70 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-ink-950/70">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Logo className="h-14 w-auto sm:h-16" />
          <span className="hidden text-xs text-slate-400 sm:block">Home Food, Made with Mother's Love</span>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Link to="/cart" className="relative btn-ghost">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <motion.span key={count} initial={{ scale: 0.4, y: -4 }} animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute -right-1 -top-1 badge bg-brand-600 text-white">{count}</motion.span>
              )}
            </Link>
            {user ? (
              <button onClick={() => { logout(); nav('/'); }} className="btn-ghost"><LogOut className="h-5 w-5" /></button>
            ) : (
              <Link to="/login" className="btn-primary">Login</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <PageWrap key={loc.pathname}><Outlet /></PageWrap>
      </main>

      <InstallPrompt />

      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-brand-100 bg-white/90 backdrop-blur-xl dark:border-white/5 dark:bg-ink-950/80 sm:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {NAV.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'}
              className={({ isActive }) => `relative flex flex-col items-center gap-1 py-2 text-xs transition-colors ${isActive ? 'text-brand-600' : 'text-slate-500 dark:text-slate-400'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="navdot" className="absolute -top-px h-0.5 w-8 rounded-full bg-brand-500" />}
                  <motion.span whileTap={{ scale: 0.85 }}><i.icon className="h-5 w-5" /></motion.span>
                  {i.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
