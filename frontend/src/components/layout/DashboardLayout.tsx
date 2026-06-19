import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Home, ChevronRight, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

export function DashboardLayout({ title, items }: { title: string; items: NavItem[] }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className="px-5 pt-5 pb-4">
        <Logo iconClassName="h-10 w-10" />
        <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-400">{title}</div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {items.map((i) => (
          <NavLink
            key={i.to}
            to={i.to}
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <i.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                <span className="flex-1">{i.label}</span>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + Go Home */}
      <div className="border-t border-slate-100 p-4 dark:border-white/5 space-y-2">
        {/* Go to Home */}
        <button
          onClick={() => { setMobileOpen(false); nav('/'); }}
          className="flex w-full items-center gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100 dark:border-brand-800/40 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/30"
        >
          <Home className="h-4 w-4" />
          Go to Customer Home
        </button>

        {/* User pill */}
        <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {(user?.name || user?.phone || '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">{user?.name || 'Admin'}</p>
            <p className="truncate text-[11px] text-slate-400">{user?.phone}</p>
          </div>
          <button
            onClick={() => { logout(); nav('/'); }}
            title="Logout"
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-charcoal-950 md:flex">
      {/* ── Desktop sidebar ──────────────────────────────── */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-slate-100 md:bg-white md:dark:border-white/5 md:dark:bg-ink-900">
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar overlay ───────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/30 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl dark:bg-ink-900 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ─────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur dark:border-white/5 dark:bg-ink-900/80">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((s) => !s)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden items-center gap-1.5 text-sm md:flex">
              <span className="font-semibold text-brand-600">{title}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="text-slate-500 capitalize">
                {(() => { const parts = loc.pathname.split('/').filter(Boolean); return (parts[parts.length - 1] || 'Overview').replace(/-/g, ' '); })()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {/* Go Home — desktop shortcut in header */}
            <button
              onClick={() => nav('/')}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-400 dark:hover:text-brand-400 sm:flex"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </button>
            <button
              onClick={() => { logout(); nav('/'); }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </main>

        <footer className="px-6 py-3 text-center text-[11px] text-slate-300 dark:text-slate-600">
          Maaswad · An initiative by Dr. Chef Vinoth Kumar
        </footer>
      </div>
    </div>
  );
}
