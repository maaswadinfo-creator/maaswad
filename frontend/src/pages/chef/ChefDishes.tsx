import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pause, Play, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { ImageUpload } from '@/components/ui/ImageUpload';
import type { Dish } from '@/types';

export default function ChefDishes() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', basePrice: 0, category: 'Traditional Foods', foodType: 'veg', preparationTimeMins: 30, quantityAvailable: 10, images: [] as string[] });
  const { data, isLoading } = useQuery({ queryKey: ['chef-dishes'], queryFn: async () => (await api.get('/chefs/dishes')).data.data as Dish[] });

  const create = useMutation({
    mutationFn: async () => (await api.post('/chefs/dishes', form)).data,
    onSuccess: () => { toast.success('Dish created, pending approval'); setShowForm(false); qc.invalidateQueries({ queryKey: ['chef-dishes'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const toggle = useMutation({ mutationFn: async (id: string) => api.patch(`/chefs/dishes/${id}/toggle`), onSuccess: () => qc.invalidateQueries({ queryKey: ['chef-dishes'] }) });
  const del = useMutation({ mutationFn: async (id: string) => api.delete(`/chefs/dishes/${id}`), onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['chef-dishes'] }); } });

  if (isLoading) return <PageLoader />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">My Dishes</h1>
        <Button onClick={() => setShowForm((s) => !s)}><Plus className="h-4 w-4" />Add Dish</Button>
      </div>

      {showForm && (
        <div className="card mb-4 grid gap-3 p-4 sm:grid-cols-2">
          <input className="input" placeholder="Dish name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="number" placeholder="Base price ₹" onChange={(e) => setForm({ ...form, basePrice: +e.target.value })} />
          <input className="input sm:col-span-2" placeholder="Description" onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="input" value={form.foodType} onChange={(e) => setForm({ ...form, foodType: e.target.value })}>
            <option value="veg">Veg</option><option value="non_veg">Non-veg</option><option value="vegan">Vegan</option><option value="egg">Egg</option>
          </select>
          <input className="input" type="number" placeholder="Prep time (min)" value={form.preparationTimeMins} onChange={(e) => setForm({ ...form, preparationTimeMins: +e.target.value })} />
          <div className="sm:col-span-2"><ImageUpload value={form.images} onChange={(images) => setForm({ ...form, images })} /></div>
          <Button className="sm:col-span-2" loading={create.isPending} onClick={() => create.mutate()}>Create Dish</Button>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {data?.map((d) => (
          <div key={d._id} className="card flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{d.name}</p>
              <p className="text-sm text-brand-700">{inr(d.displayedPrice)} <span className="text-xs text-slate-400">(base {inr(d.basePrice)})</span></p>
              <span className="badge mt-1 bg-slate-100 capitalize">{d.status.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex gap-1">
              {(d.status === 'published' || d.status === 'paused') && (
                <button onClick={() => toggle.mutate(d._id)} className="btn-ghost !p-2">{d.status === 'published' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              )}
              <button onClick={() => del.mutate(d._id)} className="btn-ghost !p-2 text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
        {!data?.length && <p className="text-slate-400">No dishes yet. Add your first dish.</p>}
      </div>
    </div>
  );
}
