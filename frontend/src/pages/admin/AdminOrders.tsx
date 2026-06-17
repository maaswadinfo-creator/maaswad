import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export default function AdminOrders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-orders'], queryFn: async () => (await api.get('/admin/orders')).data.data });
  const assign = useMutation({
    mutationFn: async (id: string) => api.post(`/admin/orders/${id}/assign`, {}),
    onSuccess: () => { toast.success('Rider auto-assigned'); qc.invalidateQueries({ queryKey: ['admin-orders'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  if (isLoading) return <PageLoader />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Live Orders</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr><th className="p-2">Order</th><th className="p-2">Chef</th><th className="p-2">Customer</th><th className="p-2">Total</th><th className="p-2">Status</th><th className="p-2">Action</th></tr>
          </thead>
          <tbody>
            {data?.map((o: any) => (
              <tr key={o._id} className="border-t">
                <td className="p-2 font-medium">{o.orderNumber}</td>
                <td className="p-2">{o.chef?.fullName}</td>
                <td className="p-2">{o.customer?.name || '—'}</td>
                <td className="p-2">{inr(o.pricing.customerTotal)}</td>
                <td className="p-2"><span className="badge bg-brand-100 text-brand-700 capitalize">{o.status.replace(/_/g, ' ')}</span></td>
                <td className="p-2">{o.status === 'ready' && <Button onClick={() => assign.mutate(o._id)}>Assign Rider</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && <p className="p-4 text-slate-400">No orders.</p>}
      </div>
    </div>
  );
}
