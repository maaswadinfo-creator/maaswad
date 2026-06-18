import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, BadgeX, Plus, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export default function AdminChefs() {
  const qc = useQueryClient();
  const [showRegistry, setShowRegistry] = useState(false);
  const [newCert, setNewCert] = useState({ number: '', holderName: '' });

  const { data: chefs, isLoading } = useQuery({ queryKey: ['admin-chefs'], queryFn: async () => (await api.get('/admin/chefs')).data.data });
  const { data: certs } = useQuery({ queryKey: ['admin-certs'], queryFn: async () => (await api.get('/admin/certificates')).data.data });

  const review = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => api.patch(`/admin/chefs/${id}/review`, { action }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); qc.invalidateQueries({ queryKey: ['admin-certs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const addCert = useMutation({
    mutationFn: async () => api.post('/admin/certificates', newCert),
    onSuccess: () => { toast.success('Certificate added'); setNewCert({ number: '', holderName: '' }); qc.invalidateQueries({ queryKey: ['admin-certs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const delCert = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/certificates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-certs'] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      {/* Certificate registry */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Certificate Registry <span className="text-sm font-normal text-stone-400">({certs?.length || 0})</span></h2>
          <Button variant="outline" onClick={() => setShowRegistry((s) => !s)}>{showRegistry ? 'Hide' : 'Manage'}</Button>
        </div>
        {showRegistry && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className="input" placeholder="Valid certificate number" value={newCert.number}
                onChange={(e) => setNewCert({ ...newCert, number: e.target.value.toUpperCase() })} />
              <input className="input" placeholder="Holder name (optional)" value={newCert.holderName}
                onChange={(e) => setNewCert({ ...newCert, holderName: e.target.value })} />
              <Button loading={addCert.isPending} onClick={() => newCert.number ? addCert.mutate() : toast.error('Enter a number')}><Plus className="h-4 w-4" />Add</Button>
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {certs?.map((c: any) => (
                <div key={c._id} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="font-mono font-semibold">{c.number}</span>
                    {c.holderName && <span className="ml-2 text-stone-400">{c.holderName}</span>}
                    <span className={`badge ml-2 ${c.status === 'claimed' ? 'bg-stone-100 text-stone-500' : 'bg-green-100 text-green-700'}`}>{c.status}</span>
                  </div>
                  <button onClick={() => delCert.mutate(c._id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              {!certs?.length && <p className="py-2 text-sm text-stone-400">No certificate numbers yet. Add the valid ones you issue.</p>}
            </div>
          </div>
        )}
      </div>

      {/* Chef applications */}
      <h1 className="text-xl font-bold">Chef Applications</h1>
      <div className="space-y-3">
        {chefs?.map((c: any) => (
          <div key={c._id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{c.fullName}</p>
                <p className="text-xs text-stone-400">{c.user?.email || c.user?.phone} · {c.cuisineSpecialization?.join(', ')}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-mono">{c.certificateNumber || 'no cert #'}</span>
                  {c.certificateNumber && (
                    c.certificateMatch
                      ? <span className="badge bg-green-100 text-green-700"><BadgeCheck className="mr-1 h-3.5 w-3.5" />In registry</span>
                      : <span className="badge bg-red-100 text-red-700"><BadgeX className="mr-1 h-3.5 w-3.5" />Not found</span>
                  )}
                  {c.certificateUrl && (
                    <a href={c.certificateUrl} target="_blank" rel="noreferrer" className="badge bg-brand-100 text-brand-700"><FileText className="mr-1 h-3.5 w-3.5" />View</a>
                  )}
                </div>
              </div>
              <span className="badge bg-stone-100 capitalize text-stone-600 dark:bg-white/5 dark:text-stone-300">{c.status.replace(/_/g, ' ')}</span>
            </div>

            {c.certificateUrl && (
              <a href={c.certificateUrl} target="_blank" rel="noreferrer" className="mt-3 block">
                <img src={c.certificateUrl} alt="certificate" className="h-32 rounded-lg border border-black/5 object-cover" />
              </a>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {!['active', 'approved'].includes(c.status) && (
                <Button disabled={!c.certificateMatch} onClick={() => review.mutate({ id: c._id, action: 'approve' })}>
                  {c.certificateMatch ? 'Verify & Approve' : 'Add cert to registry first'}
                </Button>
              )}
              {c.status !== 'rejected' && (
                <Button variant="outline" onClick={() => review.mutate({ id: c._id, action: c.status === 'active' ? 'suspend' : 'reject' })}>
                  {c.status === 'active' ? 'Suspend' : 'Reject'}
                </Button>
              )}
            </div>
          </div>
        ))}
        {!chefs?.length && <p className="text-stone-400">No applications yet.</p>}
      </div>
    </div>
  );
}
