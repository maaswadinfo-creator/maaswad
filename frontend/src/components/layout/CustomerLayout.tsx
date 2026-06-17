import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Home, Receipt, LogOut } from 'lucide-react';
import { useCart } from '@/context/cartStore';
import { useAuth } from '@/context/AuthContext';

export function CustomerLayout() {
  const count = useCart((s) => s.count());
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-brand-100">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="text-xl font-extrabold text-brand-700">Maaswad</Link>
          <span className="hidden sm:block text-xs text-slate-400">Home Food, Made with Mother's Love</span>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/cart" className="relative btn-ghost">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && <span className="absolute -right-1 -top-1 badge bg-brand-600 text-white">{count}</span>}
            </Link>
            {user ? (
              <button onClick={() => { logout(); nav('/'); }} className="btn-ghost"><LogOut className="h-5 w-5" /></button>
            ) : (
              <Link to="/login" className="btn-primary">Login</Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5"><Outlet /></main>
      <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-brand-100 bg-white sm:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {[
            { to: '/', icon: Home, label: 'Home' },
            { to: '/search', icon: Search, label: 'Search' },
            { to: '/orders', icon: Receipt, label: 'Orders' },
            { to: '/account', icon: User, label: 'Account' },
          ].map((i) => (
            <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `flex flex-col items-center gap-1 py-2 text-xs ${isActive ? 'text-brand-700' : 'text-slate-500'}`}>
              <i.icon className="h-5 w-5" />{i.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
