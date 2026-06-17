import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const NEXT: Record<string, { action: string; label: string } | undefined> = {
  chef_notified: { action: 'accept', label: 'Accept Order' },
  chef_accepted: { action: 'preparing', label: 'Start Preparing' },
  preparing: { action: 'ready', label: 'Mark Ready' },
};

export default function ChefOrders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['chef-orders'], queryFn: async () => (await api.get('/chefs/orders')).data.data });
  const update = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => api.patch(`/chefs/orders/${id}/status`, { action }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['chef-orders'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  if (isLoading) return <PageLoader />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Orders</h1>
      <div className="space-y-3">
        {data?.map((o: any) => {
          const next = NEXT[o.status];
          return (
            <div key={o._id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-slate-400">{o.items.map((i: any) => `${i.name} x${i.qty}`).join(', ')}</p>
                </div>
                <span className="badge bg-brand-100 text-brand-700 capitalize">{o.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-700">You receive {inr(o.pricing.chefReceives)}</span>
                <div className="flex gap-2">
                  {o.status === 'chef_notified' && <Button variant="outline" onClick={() => update.mutate({ id: o._id, action: 'reject' })}>Reject</Button>}
                  {next && <Button onClick={() => update.mutate({ id: o._id, action: next.action })}>{next.label}</Button>}
                </div>
              </div>
            </div>
          );
        })}
        {!data?.length && <p className="text-slate-400">No orders yet.</p>}
      </div>
    </div>
  );
}
