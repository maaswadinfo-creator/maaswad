import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { PageLoader } from '@/components/ui/Spinner';

export default function DeliveryDashboard() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['delivery-earnings'], queryFn: async () => (await api.get('/delivery/earnings')).data.data });
  const toggle = useMutation({
    mutationFn: async (v: boolean) => api.patch('/delivery/availability', { isOnline: v }),
    onSuccess: (_d, v) => { setOnline(v); toast.success(v ? 'You are online' : 'You are offline'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  if (isLoading) return <PageLoader />;

  const cards = [
    { label: 'Today', value: inr(data?.today || 0) },
    { label: 'This Week', value: inr(data?.week || 0) },
    { label: 'This Month', value: inr(data?.month || 0) },
    { label: 'Lifetime', value: inr(data?.lifetime || 0) },
  ];
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button onClick={() => toggle.mutate(!online)} className={`btn ${online ? 'bg-green-600 text-white' : 'btn-outline'}`}>
          {online ? 'Online' : 'Go Online'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <IndianRupee className="h-5 w-5 text-brand-500" />
            <p className="mt-2 text-2xl font-extrabold text-brand-700">{c.value}</p>
            <p className="text-xs text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
