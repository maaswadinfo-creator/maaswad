import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

export function DashboardLayout({ title, items }: { title: string; items: NavItem[] }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-100 bg-white dark:border-white/5 dark:bg-ink-900 md:min-h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="p-4">
          <Logo className="h-12 w-auto" />
          <div className="mt-1 text-xs text-slate-400">{title}</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end
              className={({ isActive }) => `relative flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${isActive ? 'bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5'}`}>
              <i.icon className="h-4 w-4" />{i.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3 dark:border-white/5 dark:bg-ink-900">
          <div className="text-sm text-slate-500 dark:text-slate-400">{user?.name || user?.phone}</div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button onClick={() => { logout(); nav('/'); }} className="btn-ghost text-sm"><LogOut className="h-4 w-4" /> Logout</button>
          </div>
        </header>
        <main className="p-5">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
            <Outlet />
          </motion.div>
        </main>
        <footer className="px-5 py-4 text-center text-xs text-slate-400">Maaswad — An initiative by Dr. Chef Vinoth Kumar</footer>
      </div>
    </div>
  );
}
