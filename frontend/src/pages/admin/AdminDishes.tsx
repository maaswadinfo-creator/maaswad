import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export default function AdminDishes() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-dishes'], queryFn: async () => (await api.get('/admin/dishes?status=pending_approval')).data.data });
  const review = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => api.patch(`/admin/dishes/${id}/review`, { action }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-dishes'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  if (isLoading) return <PageLoader />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Dishes Pending Approval</h1>
      <div className="space-y-2">
        {data?.map((d: any) => (
          <div key={d._id} className="card flex items-center justify-between gap-2 p-4">
            <div>
              <p className="font-semibold">{d.name}</p>
              <p className="text-xs text-slate-400">{d.chef?.fullName} · {inr(d.displayedPrice)}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => review.mutate({ id: d._id, action: 'approve' })}>Approve</Button>
              <Button variant="outline" onClick={() => review.mutate({ id: d._id, action: 'reject' })}>Reject</Button>
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-slate-400">Nothing pending. 🎉</p>}
      </div>
    </div>
  );
}
