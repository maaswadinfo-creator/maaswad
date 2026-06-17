import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }>; }

export function DashboardLayout({ title, items }: { title: string; items: NavItem[] }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen md:flex">
      <aside className="md:w-60 md:min-h-screen border-r border-slate-100 bg-white">
        <div className="p-4">
          <div className="text-lg font-extrabold text-brand-700">Maaswad</div>
          <div className="text-xs text-slate-400">{title}</div>
        </div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto px-2 pb-2">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} end className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap ${isActive ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}>
              <i.icon className="h-4 w-4" />{i.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
          <div className="text-sm text-slate-500">{user?.name || user?.phone}</div>
          <button onClick={() => { logout(); nav('/'); }} className="btn-ghost text-sm"><LogOut className="h-4 w-4" /> Logout</button>
        </header>
        <main className="p-5"><Outlet /></main>
        <footer className="px-5 py-4 text-center text-xs text-slate-400">Maaswad — Founded by Dr. Chef Vinoth</footer>
      </div>
    </div>
  );
}
