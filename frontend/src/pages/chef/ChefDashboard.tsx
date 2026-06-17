import { useQuery } from '@tanstack/react-query';
import { IndianRupee, ClipboardList, Star, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { inr } from '@/lib/cn';
import { PageLoader } from '@/components/ui/Spinner';

export default function ChefDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['chef-dashboard'],
    queryFn: async () => (await api.get('/chefs/dashboard')).data.data,
  });
  if (isLoading) return <PageLoader />;
  if (error) return <p className="text-slate-500">Complete your chef profile to view the dashboard.</p>;

  const stats = [
    { label: "Today's Sales", value: inr(data.dailySales), icon: IndianRupee },
    { label: 'Monthly Revenue', value: inr(data.monthlyRevenue), icon: Wallet },
    { label: 'Pending Orders', value: data.pendingOrders, icon: ClipboardList },
    { label: 'Active Orders', value: data.activeOrders, icon: ClipboardList },
    { label: 'Rating', value: `${data.rating?.avg || 0} ★`, icon: Star },
  ];
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <s.icon className="h-5 w-5 text-brand-500" />
            <p className="mt-2 text-2xl font-extrabold text-brand-700">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="card mt-5 p-4">
        <h2 className="mb-2 font-semibold">Recent Payouts</h2>
        {data.payoutStatus?.length ? data.payoutStatus.map((p: any) => (
          <div key={p._id} className="flex justify-between border-b py-2 text-sm last:border-0">
            <span className="capitalize">{p.status}</span><span>{inr(p.netEarnings)}</span>
          </div>
        )) : <p className="text-sm text-slate-400">No settlements yet.</p>}
      </div>
    </div>
  );
}
