/**
 * AdminChefProfiles — Super admin manages master chef evaluator profiles.
 * Create, view, deactivate admin chefs who conduct home visits.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChefHat, Plus, Phone, Star, CheckCircle2, XCircle,
  Award, Trash2, Edit3, Users, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const CUISINE_OPTIONS = [
  'Tamil Nadu', 'Chettinad', 'Kongunadu', 'Andhra', 'Telangana', 'Kerala', 'Karnataka',
  'Punjabi', 'Delhi', 'Kashmiri', 'Gujarati', 'Maharashtrian', 'Goan', 'Rajasthani',
  'Bengali', 'Biryani', 'Street Food', 'Baking & Desserts', 'Chinese', 'Continental',
  'Millet Foods', 'Organic & Healthy', 'Kids Special',
];

const EMPTY_FORM = { name: '', phone: '', bio: '', specializations: [] as string[], photo: '' };

function CreateModal({ onClose, qc }: { onClose: () => void; qc: any }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSpec = (s: string) =>
    set('specializations', form.specializations.includes(s)
      ? form.specializations.filter((x) => x !== s)
      : [...form.specializations, s]);

  const create = useMutation({
    mutationFn: () => api.post('/admin-chef/profiles', form),
    onSuccess: () => {
      toast.success('Admin chef created!');
      qc.invalidateQueries({ queryKey: ['admin-chef-profiles'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-ink-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ChefHat className="h-5 w-5 text-brand-600" /> Add Master Chef Evaluator
          </h2>
          <p className="mt-0.5 text-xs text-stone-400">This chef will conduct home visits and evaluate applicants</p>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Full Name *</label>
              <input className="input" placeholder="Chef Anand Kumar" value={form.name}
                onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <input className="input" placeholder="9876543210" value={form.phone}
                onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Photo URL (optional)</label>
            <input className="input" placeholder="https://..." value={form.photo}
              onChange={(e) => set('photo', e.target.value)} />
          </div>

          <div>
            <label className="label">Short Bio (optional)</label>
            <textarea className="input min-h-[70px] resize-none" placeholder="Brief background, experience..."
              value={form.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>

          <div>
            <label className="label">Cuisine Specializations</label>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {CUISINE_OPTIONS.map((c) => (
                <button key={c} type="button" onClick={() => toggleSpec(c)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    form.specializations.includes(c)
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-black/10 bg-white text-stone-500 hover:border-brand-300 dark:border-white/10 dark:bg-charcoal-900'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-white/5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={create.isPending} onClick={() => create.mutate()}>
            <Plus className="mr-1.5 h-4 w-4" /> Create Profile
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ p, qc }: { p: any; qc: any }) {
  const deactivate = useMutation({
    mutationFn: () => api.delete(`/admin-chef/profiles/${p._id}`),
    onSuccess: () => { toast.success('Deactivated'); qc.invalidateQueries({ queryKey: ['admin-chef-profiles'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  const reactivate = useMutation({
    mutationFn: () => api.patch(`/admin-chef/profiles/${p._id}`, { isActive: true }),
    onSuccess: () => { toast.success('Reactivated'); qc.invalidateQueries({ queryKey: ['admin-chef-profiles'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className={`card p-5 ${!p.isActive ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-4">
        {p.photo ? (
          <img src={p.photo} alt={p.name} className="h-14 w-14 rounded-xl object-cover ring-2 ring-brand-100" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/20">
            <ChefHat className="h-7 w-7 text-amber-700 dark:text-amber-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
              <p className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                <Phone className="h-3 w-3" />{p.phone}
              </p>
            </div>
            <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
              p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'
            }`}>
              {p.isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {p.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {p.bio && <p className="mt-2 text-xs text-stone-500 line-clamp-2">{p.bio}</p>}

          {p.specializations?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {p.specializations.slice(0, 5).map((s: string) => (
                <span key={s} className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  {s}
                </span>
              ))}
              {p.specializations.length > 5 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                  +{p.specializations.length - 5}
                </span>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-4 text-xs text-stone-400">
            <span className="flex items-center gap-1">
              <BarChart2 className="h-3 w-3" /> {p.totalEvaluations || 0} evaluations
            </span>
            {p.avgRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-400" /> {p.avgRating.toFixed(1)} avg
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
        {p.isActive ? (
          <Button variant="outline" onClick={() => deactivate.mutate()} loading={deactivate.isPending}
            className="text-xs text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Deactivate
          </Button>
        ) : (
          <Button onClick={() => reactivate.mutate()} loading={reactivate.isPending} className="text-xs">
            Reactivate
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AdminChefProfiles() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-chef-profiles'],
    queryFn: async () => (await api.get('/admin-chef/profiles')).data.data,
  });

  if (isLoading) return <PageLoader />;

  const active = (profiles || []).filter((p: any) => p.isActive);
  const inactive = (profiles || []).filter((p: any) => !p.isActive);

  return (
    <div className="space-y-5">
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} qc={qc} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Master Chef Evaluators</h1>
          <p className="mt-0.5 text-xs text-stone-400">
            These chefs conduct home visits and evaluate applicants on behalf of Maaswad
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Master Chef
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Evaluators', value: profiles?.length || 0, icon: Users, color: 'text-brand-500' },
          { label: 'Active', value: active.length, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Total Evaluations', value: (profiles || []).reduce((s: number, p: any) => s + (p.totalEvaluations || 0), 0), icon: Award, color: 'text-amber-500' },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <s.icon className={`h-8 w-8 ${s.color}`} />
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{s.value}</p>
              <p className="text-xs text-stone-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active profiles */}
      {active.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-stone-400 uppercase tracking-wide">Active ({active.length})</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {active.map((p: any) => <ProfileCard key={p._id} p={p} qc={qc} />)}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-stone-400 uppercase tracking-wide">Inactive ({inactive.length})</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {inactive.map((p: any) => <ProfileCard key={p._id} p={p} qc={qc} />)}
          </div>
        </section>
      )}

      {!profiles?.length && (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
            <ChefHat className="h-8 w-8 text-amber-400" />
          </div>
          <p className="font-medium text-stone-500">No master chefs added yet</p>
          <p className="text-xs text-stone-300">Add your first master chef evaluator to start scheduling home visits</p>
          <Button onClick={() => setShowCreate(true)} className="mt-2">
            <Plus className="mr-1.5 h-4 w-4" /> Add First Master Chef
          </Button>
        </div>
      )}
    </div>
  );
}
