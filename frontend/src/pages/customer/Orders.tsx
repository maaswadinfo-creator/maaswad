import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { inr } from '@/lib/cn';
import { PageLoader } from '@/components/ui/Spinner';
import type { Order } from '@/types';

export default function Orders() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: async () => (await api.get('/orders/mine')).data.data as Order[],
  });
  if (isLoading) return <PageLoader />;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold">My Orders</h1>
      <div className="space-y-3">
        {data?.map((o) => (
          <Link to={`/orders/${o._id}`} key={o._id} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{o.orderNumber}</p>
              <p className="text-xs text-slate-400">{o.items.map((i) => `${i.name} x${i.qty}`).join(', ')}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand-700">{inr(o.pricing.customerTotal)}</p>
              <span className="badge bg-brand-100 text-brand-700 capitalize">{o.status.replace(/_/g, ' ')}</span>
            </div>
          </Link>
        ))}
        {!data?.length && <p className="text-center text-slate-400">No orders yet.</p>}
      </div>
    </div>
  );
}
