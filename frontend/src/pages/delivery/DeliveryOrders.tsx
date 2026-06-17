import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const NEXT: Record<string, { action: string; label: string } | undefined> = {
  rider_assigned: { action: 'pickup_started', label: 'Start Pickup' },
  pickup_started: { action: 'picked_up', label: 'Picked Up' },
  picked_up: { action: 'out_for_delivery', label: 'Out for Delivery' },
  out_for_delivery: { action: 'delivered', label: 'Mark Delivered' },
};

export default function DeliveryOrders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['delivery-assigned'], queryFn: async () => (await api.get('/delivery/assigned')).data.data });
  const update = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => api.patch(`/delivery/orders/${id}/status`, { action }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['delivery-assigned'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  if (isLoading) return <PageLoader />;

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Assigned Deliveries</h1>
      <div className="space-y-3">
        {data?.map((o: any) => {
          const next = NEXT[o.status];
          return (
            <div key={o._id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-slate-400">Pickup: {o.chef?.fullName} → {o.customer?.name}</p>
                  <p className="text-xs text-slate-400">{o.deliveryAddress?.line1}, {o.deliveryAddress?.city}</p>
                </div>
                <span className="badge bg-brand-100 text-brand-700 capitalize">{o.status.replace(/_/g, ' ')}</span>
              </div>
              {next && <Button className="mt-3 w-full" onClick={() => update.mutate({ id: o._id, action: next.action })}>{next.label}</Button>}
            </div>
          );
        })}
        {!data?.length && <p className="text-slate-400">No active deliveries.</p>}
      </div>
    </div>
  );
}
