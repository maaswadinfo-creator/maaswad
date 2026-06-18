import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, ChefHat, Flame, PackageCheck, Bike, Truck, Home, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const FLOW = ['chef_notified', 'chef_accepted', 'preparing', 'ready', 'rider_assigned', 'picked_up', 'out_for_delivery', 'delivered'];
const META: Record<string, { label: string; icon: any }> = {
  chef_notified: { label: 'Order placed', icon: BadgeCheck },
  chef_accepted: { label: 'Chef accepted', icon: ChefHat },
  preparing: { label: 'Preparing your food', icon: Flame },
  ready: { label: 'Food is ready', icon: PackageCheck },
  rider_assigned: { label: 'Rider assigned', icon: Bike },
  picked_up: { label: 'Picked up', icon: Bike },
  out_for_delivery: { label: 'Out for delivery', icon: Truck },
  delivered: { label: 'Delivered', icon: Home },
};

export default function OrderTracking() {
  const { id } = useParams();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data.data,
    refetchInterval: 8000,
  });

  if (isLoading || !data) {
    return <div className="mx-auto max-w-lg space-y-3"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div>;
  }
  const currentIdx = FLOW.indexOf(data.status);
  const progress = Math.max(0, currentIdx) / (FLOW.length - 1);

  const confirm = async () => {
    try { await api.post(`/orders/${id}/confirm`); toast.success('Delivery confirmed'); refetch(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">{data.orderNumber}</p>
            <p className="text-xs text-slate-400">ETA ~{data.etaMinutes} min</p>
          </div>
          <span className="badge bg-brand-100 capitalize text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">{data.status.replace(/_/g, ' ')}</span>
        </div>

        <div className="relative mt-6 pl-2">
          {/* progress rail */}
          <div className="absolute left-[18px] top-2 h-[calc(100%-1rem)] w-0.5 rounded bg-slate-100 dark:bg-white/10" />
          <motion.div className="absolute left-[18px] top-2 w-0.5 rounded bg-brand-500"
            initial={{ height: 0 }} animate={{ height: `calc((100% - 1rem) * ${progress})` }} transition={{ duration: 0.8, ease: 'easeInOut' }} />

          <div className="space-y-4">
            {FLOW.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              const Icon = META[step].icon;
              return (
                <div key={step} className="relative flex items-center gap-3">
                  <motion.div
                    initial={false}
                    animate={done ? { scale: 1, backgroundColor: '#ea580c', color: '#fff' } : {}}
                    className={`z-10 flex h-9 w-9 items-center justify-center rounded-full ${done ? 'text-white' : 'bg-slate-100 text-slate-300 dark:bg-white/5 dark:text-slate-600'} ${active ? 'animate-pulse-ring' : ''}`}>
                    {done && i < currentIdx ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </motion.div>
                  <span className={done ? 'font-medium' : 'text-slate-400'}>{META[step].label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {data.status === 'delivered' && (
          <Button className="mt-6 w-full" onClick={confirm}>Confirm Delivery</Button>
        )}
      </div>

      <div className="card mt-4 p-4">
        <h2 className="mb-2 font-semibold">Items</h2>
        {data.items.map((it: any, i: number) => (
          <div key={i} className="flex justify-between text-sm"><span>{it.name} × {it.qty}</span><span>{inr(it.displayedLine)}</span></div>
        ))}
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-bold text-brand-700 dark:border-white/5 dark:text-brand-400"><span>Total</span><span>{inr(data.pricing.customerTotal)}</span></div>
      </div>
    </div>
  );
}
