/**
 * EvalChefDashboard — Portal for master chef evaluators (admin_chef role).
 * They see their scheduled home visits and submit feedback + decision after each visit.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, MapPin, ChefHat, Star, CheckCircle2,
  XCircle, Award, FileText, Phone, AlertCircle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';

const CUISINE_OPTIONS = [
  'Tamil Nadu', 'Chettinad', 'Kongunadu', 'Andhra', 'Telangana', 'Kerala', 'Karnataka',
  'Punjabi', 'Delhi', 'Kashmiri', 'Gujarati', 'Maharashtrian', 'Goan', 'Rajasthani',
  'Bengali', 'Biryani', 'Street Food', 'Baking & Desserts', 'Chinese', 'Continental',
  'Millet Foods', 'Organic & Healthy', 'Kids Special',
];

// ── Star Rating Input ─────────────────────────────────────────────────────────
function StarInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-stone-500">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-lg text-lg transition ${n <= value ? 'text-amber-400' : 'text-stone-200 hover:text-amber-300'}`}>
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Evaluation Form (shown in-place on a visit card) ─────────────────────────
function EvalForm({ visit, qc, onClose }: { visit: any; qc: any; onClose: () => void }) {
  const chef = visit.homeChef;
  const [form, setForm] = useState({
    foodRating: 0, hygieneRating: 0, overallRating: 0,
    feedback: '',
    decision: '' as 'selected' | 'rejected' | '',
    rejectionReason: '',
    approvedDishes: (chef?.cuisineSpecialization || []) as string[],
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDish = (d: string) =>
    set('approvedDishes', form.approvedDishes.includes(d)
      ? form.approvedDishes.filter((x: string) => x !== d)
      : [...form.approvedDishes, d]);

  const submit = useMutation({
    mutationFn: () => api.patch(`/admin-chef/visits/${visit._id}/evaluate`, {
      foodRating: form.foodRating || undefined,
      hygieneRating: form.hygieneRating || undefined,
      overallRating: form.overallRating || undefined,
      feedback: form.feedback,
      decision: form.decision,
      rejectionReason: form.rejectionReason,
      approvedDishes: form.approvedDishes,
    }),
    onSuccess: () => {
      toast.success(form.decision === 'selected' ? '✅ Chef selected! Admin will send the certificate.' : 'Evaluation submitted');
      qc.invalidateQueries({ queryKey: ['eval-visits'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="space-y-5 border-t border-brand-100 bg-brand-50/30 p-5 dark:border-brand-900/30 dark:bg-brand-900/10">
      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
        <Award className="h-4 w-4 text-brand-600" /> Submit Your Evaluation
      </h3>

      {/* Ratings */}
      <div className="grid grid-cols-3 gap-4">
        <StarInput label="Food Quality" value={form.foodRating} onChange={(v) => set('foodRating', v)} />
        <StarInput label="Kitchen Hygiene" value={form.hygieneRating} onChange={(v) => set('hygieneRating', v)} />
        <StarInput label="Overall" value={form.overallRating} onChange={(v) => set('overallRating', v)} />
      </div>

      {/* Feedback */}
      <div>
        <label className="label">Tasting Notes / Observations</label>
        <textarea className="input min-h-[90px] resize-none text-sm"
          placeholder="Describe the taste, presentation, hygiene, and your overall impression…"
          value={form.feedback} onChange={(e) => set('feedback', e.target.value)} />
      </div>

      {/* Decision */}
      <div>
        <p className="mb-2 text-xs font-semibold text-stone-500">Your Decision *</p>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => set('decision', 'selected')}
            className={`flex items-center gap-2 rounded-xl border-2 p-3 transition text-sm font-semibold ${
              form.decision === 'selected'
                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                : 'border-slate-200 bg-white text-stone-500 hover:border-green-300 dark:border-white/10 dark:bg-charcoal-900'
            }`}>
            <CheckCircle2 className="h-5 w-5" /> Selected ✓
          </button>
          <button type="button" onClick={() => set('decision', 'rejected')}
            className={`flex items-center gap-2 rounded-xl border-2 p-3 transition text-sm font-semibold ${
              form.decision === 'rejected'
                ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                : 'border-slate-200 bg-white text-stone-500 hover:border-red-300 dark:border-white/10 dark:bg-charcoal-900'
            }`}>
            <XCircle className="h-5 w-5" /> Not Selected ✗
          </button>
        </div>
      </div>

      {/* If rejected: reason */}
      {form.decision === 'rejected' && (
        <div>
          <label className="label">Reason for rejection (will be shared with chef)</label>
          <textarea className="input min-h-[60px] resize-none text-sm"
            placeholder="Please provide a constructive reason…"
            value={form.rejectionReason} onChange={(e) => set('rejectionReason', e.target.value)} />
        </div>
      )}

      {/* If selected: approved dishes */}
      {form.decision === 'selected' && (
        <div>
          <p className="mb-2 text-xs font-semibold text-stone-500">
            Select Approved Cuisine Specializations *
            <span className="ml-1 font-normal text-stone-300">({form.approvedDishes.length} selected)</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CUISINE_OPTIONS.map((d) => (
              <button key={d} type="button" onClick={() => toggleDish(d)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  form.approvedDishes.includes(d)
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-black/10 bg-white text-stone-500 hover:border-brand-300 dark:border-white/10 dark:bg-charcoal-900'
                }`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          loading={submit.isPending}
          onClick={() => {
            if (!form.decision) return toast.error('Please select a decision');
            if (form.decision === 'selected' && !form.approvedDishes.length) return toast.error('Select at least one approved cuisine');
            submit.mutate();
          }}
          className={`flex items-center gap-2 ${form.decision === 'selected' ? 'bg-green-600 hover:bg-green-700' : form.decision === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}`}
        >
          <Sparkles className="h-4 w-4" />
          {form.decision === 'selected' ? 'Submit — Mark as Selected' : form.decision === 'rejected' ? 'Submit — Mark as Rejected' : 'Submit Evaluation'}
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Visit card ────────────────────────────────────────────────────────────────
function VisitCard({ v, qc }: { v: any; qc: any }) {
  const [evaluating, setEvaluating] = useState(false);
  const chef = v.homeChef;

  const isUpcoming = v.status === 'scheduled' && new Date(v.scheduledDate) >= new Date(new Date().setHours(0, 0, 0, 0));
  const isOverdue = v.status === 'scheduled' && new Date(v.scheduledDate) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className={`card overflow-hidden ${isOverdue ? 'ring-2 ring-amber-300 dark:ring-amber-700' : ''}`}>
      {isOverdue && (
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-900/10 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5" /> Visit date has passed — please submit your evaluation
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Chef info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {chef?.profilePhoto ? (
              <img src={chef.profilePhoto} alt={chef.fullName} className="h-12 w-12 rounded-xl object-cover ring-2 ring-brand-100" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-orange-100">
                <ChefHat className="h-6 w-6 text-brand-600" />
              </div>
            )}
            <div>
              <p className="font-semibold">{chef?.fullName}</p>
              <p className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                <Phone className="h-3 w-3" /> {chef?.mobile || chef?.user?.phone}
              </p>
              {chef?.cuisineSpecialization?.length > 0 && (
                <p className="text-xs text-stone-400 mt-0.5">
                  Specializes in: {chef.cuisineSpecialization.slice(0, 3).join(', ')}
                </p>
              )}
            </div>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold border ${
            v.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            v.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            'bg-stone-50 text-stone-500 border-stone-200'
          }`}>
            {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
          </span>
        </div>

        {/* Visit details */}
        <div className="flex flex-wrap gap-3 text-xs text-stone-500 rounded-lg bg-slate-50 dark:bg-white/5 p-2.5">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-brand-500" />
            {new Date(v.scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {v.scheduledTime && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-brand-500" /> {v.scheduledTime}
            </span>
          )}
          {v.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-500" /> {v.address}
            </span>
          )}
        </div>

        {v.notes && (
          <p className="text-xs text-stone-400 italic">Note: {v.notes}</p>
        )}

        {/* Completed visit result */}
        {v.status === 'completed' && (
          <div className={`rounded-xl border p-3 ${
            v.decision === 'selected'
              ? 'border-green-200 bg-green-50 dark:border-green-800/30 dark:bg-green-900/10'
              : 'border-red-200 bg-red-50 dark:border-red-800/30 dark:bg-red-900/10'
          }`}>
            <p className={`text-sm font-semibold ${v.decision === 'selected' ? 'text-green-700' : 'text-red-600'}`}>
              {v.decision === 'selected' ? '✅ You selected this chef' : '✗ You did not select this chef'}
            </p>
            {v.certEmailSentAt && (
              <p className="mt-1 text-xs text-green-600">
                <Award className="inline h-3 w-3 mr-1" />
                Certificate emailed on {new Date(v.certEmailSentAt).toLocaleDateString('en-IN')}
              </p>
            )}
            {v.approvedDishes?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {v.approvedDishes.map((d: string) => (
                  <span key={d} className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] text-green-700 dark:bg-green-900/30">{d}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action: submit evaluation */}
        {v.status === 'scheduled' && !evaluating && (
          <Button onClick={() => setEvaluating(true)} className="flex items-center gap-2 w-full justify-center">
            <FileText className="h-4 w-4" /> Submit Evaluation
          </Button>
        )}
      </div>

      {evaluating && (
        <EvalForm visit={v} qc={qc} onClose={() => setEvaluating(false)} />
      )}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function EvalChefDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');

  const { data: visits, isLoading } = useQuery({
    queryKey: ['eval-visits'],
    queryFn: async () => (await api.get('/admin-chef/visits')).data.data,
  });

  if (isLoading) return <PageLoader />;

  const all = visits || [];
  const upcoming = all.filter((v: any) => v.status === 'scheduled');
  const completed = all.filter((v: any) => v.status !== 'scheduled');
  const overdueCount = upcoming.filter((v: any) => new Date(v.scheduledDate) < new Date(new Date().setHours(0, 0, 0, 0))).length;

  const display = tab === 'upcoming' ? upcoming : completed;

  return (
    <div className="space-y-5">
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-600 to-orange-500 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Welcome, Chef {user?.name || 'Evaluator'}!</h1>
            <p className="text-sm text-white/80">Master Chef Evaluator · Maaswad Platform</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Upcoming', value: upcoming.length },
            { label: 'Completed', value: completed.length },
            { label: 'Needs Attention', value: overdueCount },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/15 p-3 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800/40 dark:bg-amber-900/10">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You have <strong>{overdueCount}</strong> visit{overdueCount > 1 ? 's' : ''} with past dates that need evaluation. Please submit your feedback.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden w-fit text-sm">
        {([['upcoming', `Upcoming (${upcoming.length})`], ['completed', `Completed (${completed.length})`]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 font-medium transition ${
              tab === key ? 'bg-brand-600 text-white' : 'bg-white text-stone-600 hover:bg-slate-50 dark:bg-charcoal-900 dark:text-stone-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Visit list */}
      <div className="space-y-4">
        {display.map((v: any) => <VisitCard key={v._id} v={v} qc={qc} />)}
        {!display.length && (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <Calendar className="h-10 w-10 text-stone-300" />
            <p className="text-stone-400">{tab === 'upcoming' ? 'No upcoming visits' : 'No completed evaluations yet'}</p>
            {tab === 'upcoming' && <p className="text-xs text-stone-300">The admin team will schedule visits for you to conduct</p>}
          </div>
        )}
      </div>
    </div>
  );
}
