import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IndianRupee, ShoppingBag, Users, Store, Bike } from 'lucide-react';
import { api } from '@/lib/api';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Skeleton } from '@/components/ui/Skeleton';
import { stagger, fadeUp } from '@/lib/motion';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-revenue'], queryFn: async () => (await api.get('/admin/revenue')).data.data });

  const cards = data ? [
    { label: 'Platform Revenue', value: data.platformRevenue, icon: IndianRupee, money: true },
    { label: 'GMV', value: data.gmv, icon: ShoppingBag, money: true },
    { label: 'Total Orders', value: data.totalOrders, icon: ShoppingBag },
    { label: 'Customers', value: data.customers, icon: Users },
    { label: 'Active Chefs', value: data.activeChefs, icon: Store },
    { label: 'Active Riders', value: data.activeRiders, icon: Bike },
  ] : [];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Platform Overview</h1>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((c) => (
            <motion.div key={c.label} variants={fadeUp} whileHover={{ y: -4 }} className="card p-4">
              <c.icon className="h-5 w-5 text-brand-500" />
              <p className="mt-2 text-xl font-extrabold text-brand-700 dark:text-brand-400">
                {c.money && '₹'}<AnimatedNumber value={c.value} />
              </p>
              <p className="text-xs text-slate-400">{c.label}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
