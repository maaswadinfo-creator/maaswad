import { useQuery } from '@tanstack/react-query';
import { IndianRupee, ShoppingBag, Users, Store, Bike } from 'lucide-react';
import { api } from '@/lib/api';
import { inr } from '@/lib/cn';
import { PageLoader } from '@/components/ui/Spinner';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-revenue'], queryFn: async () => (await api.get('/admin/revenue')).data.data });
  if (isLoading) return <PageLoader />;
  const cards = [
    { label: 'Platform Revenue', value: inr(data.platformRevenue), icon: IndianRupee },
    { label: 'GMV', value: inr(data.gmv), icon: ShoppingBag },
    { label: 'Total Orders', value: data.totalOrders, icon: ShoppingBag },
    { label: 'Customers', value: data.customers, icon: Users },
    { label: 'Active Chefs', value: data.activeChefs, icon: Store },
    { label: 'Active Riders', value: data.activeRiders, icon: Bike },
  ];
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Platform Overview</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <c.icon className="h-5 w-5 text-brand-500" />
            <p className="mt-2 text-xl font-extrabold text-brand-700">{c.value}</p>
            <p className="text-xs text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
