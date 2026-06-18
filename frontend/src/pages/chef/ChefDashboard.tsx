import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IndianRupee, ClipboardList, Star, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { inr } from '@/lib/cn';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Skeleton } from '@/components/ui/Skeleton';
import { stagger, fadeUp } from '@/lib/motion';

export default function ChefDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['chef-dashboard'],
    queryFn: async () => (await api.get('/chefs/dashboard')).data.data,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }
  if (error) return <p className="text-slate-500">Complete your chef profile to view the dashboard.</p>;

  const stats = [
    { label: "Today's Sales", value: data.dailySales, icon: IndianRupee, money: true },
    { label: 'Monthly Revenue', value: data.monthlyRevenue, icon: Wallet, money: true },
    { label: 'Pending Orders', value: data.pendingOrders, icon: ClipboardList },
    { label: 'Active Orders', value: data.activeOrders, icon: ClipboardList },
  ];
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Dashboard</h1>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp} whileHover={{ y: -4 }} className="card p-4">
            <s.icon className="h-5 w-5 text-brand-500" />
            <p className="mt-2 text-2xl font-extrabold text-brand-700 dark:text-brand-400">
              {s.money && '₹'}<AnimatedNumber value={s.value} />
            </p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </motion.div>
        ))}
        <motion.div variants={fadeUp} whileHover={{ y: -4 }} className="card p-4">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <p className="mt-2 text-2xl font-extrabold text-brand-700 dark:text-brand-400">{data.rating?.avg || 0} ★</p>
          <p className="text-xs text-slate-400">Rating</p>
        </motion.div>
      </motion.div>

      <div className="card mt-5 p-4">
        <h2 className="mb-2 font-semibold">Recent Payouts</h2>
        {data.payoutStatus?.length ? data.payoutStatus.map((p: any) => (
          <div key={p._id} className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-white/5">
            <span className="capitalize">{p.status}</span><span>{inr(p.netEarnings)}</span>
          </div>
        )) : <p className="text-sm text-slate-400">No settlements yet.</p>}
      </div>
    </div>
  );
}
