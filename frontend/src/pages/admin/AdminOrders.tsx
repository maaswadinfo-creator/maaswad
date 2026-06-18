import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export default function AdminOrders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: async () => (await api.get('/admin/orders')).data.data });
  const dispatch = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => api.post(`/admin/orders/${id}/dispatch`, { action }),
    onSuccess: () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  if (isLoading) return <PageLoader />;

  const nextAction = (status: string) =>
    status === 'ready' ? { action: 'out_for_delivery', label: 'Hand to courier' }
    : status === 'out_for_delivery' ? { action: 'delivered', label: 'Mark delivered' }
    : null;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold">Live Orders</h1>
      <p className="mb-4 text-sm text-stone-400">Delivery is handled by a third-party courier — dispatch orders below.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-stone-400">
            <tr><th className="p-2">Order</th><th className="p-2">Chef</th><th className="p-2">Customer</th><th className="p-2">Total</th><th className="p-2">Status</th><th className="p-2">Action</th></tr>
          </thead>
          <tbody>
            {data?.map((o: any) => {
              const next = nextAction(o.status);
              return (
                <tr key={o._id} className="border-t border-black/5 dark:border-white/5">
                  <td className="p-2 font-medium">{o.orderNumber}</td>
                  <td className="p-2">{o.chef?.fullName}</td>
                  <td className="p-2">{o.customer?.name || '—'}</td>
                  <td className="p-2">{inr(o.pricing.customerTotal)}</td>
                  <td className="p-2"><span className="badge bg-brand-100 capitalize text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">{o.status.replace(/_/g, ' ')}</span></td>
                  <td className="p-2">{next && <Button onClick={() => dispatch.mutate({ id: o._id, action: next.action })}>{next.label}</Button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!data?.length && <p className="p-4 text-stone-400">No orders.</p>}
      </div>
    </div>
  );
}
