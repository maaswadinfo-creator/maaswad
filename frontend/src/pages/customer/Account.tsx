import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Gift, Store, Bike, Shield, Crown } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

const ROLE_LINKS: { role: Role; to: string; label: string; icon: any }[] = [
  { role: 'platform_owner', to: '/admin', label: 'Super Admin Console', icon: Crown },
  { role: 'operations_manager', to: '/admin', label: 'Admin Panel', icon: Shield },
  { role: 'home_chef', to: '/chef', label: 'Chef Dashboard', icon: Store },
  { role: 'delivery_partner', to: '/delivery', label: 'Delivery Dashboard', icon: Bike },
];

export default function Account() {
  const { user, switchRole } = useAuth();
  const { data } = useQuery({ queryKey: ['me-profile'], queryFn: async () => (await api.get('/me/profile')).data.data });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="card p-5">
        <p className="text-lg font-bold">{user?.name || 'Food Lover'}</p>
        <p className="text-sm text-slate-400">{user?.phone || user?.email}</p>
        <div className="mt-3 flex gap-3">
          <div className="flex-1 rounded-xl bg-brand-50 p-3 text-center">
            <p className="text-xs text-slate-500">Loyalty Points</p>
            <p className="text-xl font-bold text-brand-700">{data?.loyaltyPoints ?? user?.loyaltyPoints ?? 0}</p>
          </div>
          <div className="flex-1 rounded-xl bg-brand-50 p-3 text-center">
            <p className="text-xs text-slate-500">Wallet</p>
            <p className="text-xl font-bold text-brand-700">₹{data?.walletBalance ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="card flex items-center gap-3 p-4">
        <Gift className="h-5 w-5 text-brand-600" />
        <div className="flex-1"><p className="text-sm font-semibold">Refer & Earn</p><p className="text-xs text-slate-400">Your code: <b>{data?.referralCode || user?.referralCode}</b></p></div>
      </div>

      <div className="space-y-2">
        {ROLE_LINKS.filter((l) => user?.roles.includes(l.role)).map((l) => (
          <Link key={l.label} to={l.to} onClick={() => switchRole(l.role)} className="card flex items-center gap-3 p-4">
            <l.icon className="h-5 w-5 text-brand-600" /><span className="font-medium">{l.label}</span>
          </Link>
        ))}
        {!user?.roles.includes('home_chef') && (
          <Link to="/become-chef" className="card flex items-center gap-3 p-4">
            <Store className="h-5 w-5 text-brand-600" /><span className="font-medium">Become a Home Chef</span>
          </Link>
        )}
      </div>
    </div>
  );
}
