import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const FLOW = ['chef_notified', 'chef_accepted', 'preparing', 'ready', 'rider_assigned', 'picked_up', 'out_for_delivery', 'delivered'];
const LABELS: Record<string, string> = {
  chef_notified: 'Order placed', chef_accepted: 'Chef accepted', preparing: 'Preparing', ready: 'Food ready',
  rider_assigned: 'Rider assigned', picked_up: 'Picked up', out_for_delivery: 'Out for delivery', delivered: 'Delivered',
};

export default function OrderTracking() {
  const { id } = useParams();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data.data,
    refetchInterval: 8000,
  });
  if (isLoading || !data) return <PageLoader />;
  const currentIdx = FLOW.indexOf(data.status);

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
          <span className="badge bg-brand-100 text-brand-700 capitalize">{data.status.replace(/_/g, ' ')}</span>
        </div>

        <div className="mt-5 space-y-3">
          {FLOW.map((step, i) => {
            const done = i <= currentIdx;
            return (
              <div key={step} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                  {done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
                </div>
                <span className={done ? 'font-medium' : 'text-slate-400'}>{LABELS[step]}</span>
              </div>
            );
          })}
        </div>

        {data.status === 'delivered' && (
          <Button className="mt-5 w-full" onClick={confirm}>Confirm Delivery</Button>
        )}
      </div>

      <div className="card mt-4 p-4">
        <h2 className="mb-2 font-semibold">Items</h2>
        {data.items.map((it: any, i: number) => (
          <div key={i} className="flex justify-between text-sm"><span>{it.name} × {it.qty}</span><span>{inr(it.displayedLine)}</span></div>
        ))}
        <div className="mt-2 flex justify-between border-t pt-2 font-bold text-brand-700"><span>Total</span><span>{inr(data.pricing.customerTotal)}</span></div>
      </div>
    </div>
  );
}
