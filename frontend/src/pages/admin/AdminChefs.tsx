import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export default function AdminChefs() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-chefs'], queryFn: async () => (await api.get('/admin/chefs')).data.data });
  const review = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => api.patch(`/admin/chefs/${id}/review`, { action }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  if (isLoading) return <PageLoader />;
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Chef Applications</h1>
      <div className="space-y-2">
        {data?.map((c: any) => (
          <div key={c._id} className="card flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="font-semibold">{c.fullName}</p>
              <p className="text-xs text-slate-400">{c.user?.email || c.user?.phone} · {c.cuisineSpecialization?.join(', ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge bg-slate-100 capitalize">{c.status.replace(/_/g, ' ')}</span>
              {!['active', 'approved'].includes(c.status) && <Button onClick={() => review.mutate({ id: c._id, action: 'approve' })}>Approve</Button>}
              {c.status !== 'rejected' && <Button variant="outline" onClick={() => review.mutate({ id: c._id, action: c.status === 'active' ? 'suspend' : 'reject' })}>{c.status === 'active' ? 'Suspend' : 'Reject'}</Button>}
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-slate-400">No applications.</p>}
      </div>
    </div>
  );
}
