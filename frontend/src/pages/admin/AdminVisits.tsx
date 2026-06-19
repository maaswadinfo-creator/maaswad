/**
 * AdminVisits — Super admin / ops: schedule home visits, view all visits,
 * see evaluation results, and send certificates.
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock, MapPin, ChefHat, Award, CheckCircle2,
  XCircle, Plus, Mail, Star, AlertTriangle, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const STATUS_COLOR: Record<string, string> = {
  scheduled:  'bg-blue-100 text-blue-700 border-blue-200',
  completed:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled:  'bg-stone-100 text-stone-500 border-stone-200',
};

const DECISION_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  selected:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-600',
};

// ── Schedule Visit Modal ────────────────────────────────────────────────────
function ScheduleModal({ onClose, qc }: { onClose: () => void; qc: any }) {
  const [form, setForm] = useState({
    homeChefId: '', adminChefId: '', scheduledDate: '', scheduledTime: '', address: '', notes: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: pendingChefs } = useQuery({
    queryKey: ['admin-chefs-pending'],
    queryFn: async () => (await api.get('/admin/chefs')).data.data,
  });
  const { data: adminChefs } = useQuery({
    queryKey: ['admin-chef-profiles'],
    queryFn: async () => (await api.get('/admin-chef/profiles')).data.data,
  });

  const pendingList = (pendingChefs || []).filter((c: any) =>
    ['applied', 'under_review'].includes(c.status)
  );
  const activeEvaluators = (adminChefs || []).filter((c: any) => c.isActive);

  const schedule = useMutation({
    mutationFn: () => api.post('/admin-chef/visits', form),
    onSuccess: () => {
      toast.success('Home visit scheduled!');
      qc.invalidateQueries({ queryKey: ['admin-visits'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-ink-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-100 px-6 py-4 dark:border-white/5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Calendar className="h-5 w-5 text-brand-600" /> Schedule Home Visit
          </h2>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="label">Chef Applicant *</label>
            <select className="input" value={form.homeChefId} onChange={(e) => set('homeChefId', e.target.value)}>
              <option value="">Select applicant…</option>
              {pendingList.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.fullName} — {c.user?.phone || c.mobile} ({c.status.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Assign Master Chef *</label>
            <select className="input" value={form.adminChefId} onChange={(e) => set('adminChefId', e.target.value)}>
              <option value="">Select master chef…</option>
              {activeEvaluators.map((c: any) => (
                <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Visit Date *</label>
              <input className="input" type="date" value={form.scheduledDate}
                onChange={(e) => set('scheduledDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">Time (optional)</label>
              <input className="input" type="time" value={form.scheduledTime}
                onChange={(e) => set('scheduledTime', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Visit Address</label>
            <input className="input" placeholder="Chef's home/kitchen address" value={form.address}
              onChange={(e) => set('address', e.target.value)} />
          </div>

          <div>
            <label className="label">Notes for evaluator (optional)</label>
            <textarea className="input min-h-[60px] resize-none text-sm" placeholder="Any special instructions…"
              value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-white/5">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            loading={schedule.isPending}
            onClick={() => {
              if (!form.homeChefId || !form.adminChefId || !form.scheduledDate) {
                toast.error('Please fill required fields');
                return;
              }
              schedule.mutate();
            }}
          >
            <Calendar className="mr-1.5 h-4 w-4" /> Schedule Visit
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Rating stars display ────────────────────────────────────────────────────
function Stars({ value }: { value: number | null }) {
  if (!value) return <span className="text-stone-300 text-xs">—</span>;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < value ? 'text-amber-400 fill-amber-400' : 'text-stone-200'}`} />
      ))}
    </span>
  );
}

// ── Visit card ──────────────────────────────────────────────────────────────
function VisitCard({ v, qc }: { v: any; qc: any }) {
  const [showCertConfirm, setShowCertConfirm] = useState(false);

  const cancel = useMutation({
    mutationFn: () => api.patch(`/admin-chef/visits/${v._id}/cancel`),
    onSuccess: () => { toast.success('Visit cancelled'); qc.invalidateQueries({ queryKey: ['admin-visits'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const sendCert = useMutation({
    mutationFn: () => api.post(`/admin-chef/visits/${v._id}/send-certificate`),
    onSuccess: (res) => {
      toast.success(`Certificate emailed to ${res.data.data.sentTo}`);
      qc.invalidateQueries({ queryKey: ['admin-visits'] });
      setShowCertConfirm(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const chef = v.homeChef;
  const evaluator = v.adminChef;

  return (
    <div className="card overflow-hidden">
      {/* Status strip */}
      <div className={`flex items-center justify-between px-4 py-2 text-xs font-semibold ${
        v.status === 'scheduled' ? 'bg-blue-50 dark:bg-blue-900/10' :
        v.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/10' :
        'bg-stone-50 dark:bg-white/[0.02]'
      }`}>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 ${STATUS_COLOR[v.status]}`}>
          {v.status === 'scheduled' && <Clock className="h-3 w-3" />}
          {v.status === 'completed' && <CheckCircle2 className="h-3 w-3" />}
          {v.status === 'cancelled' && <XCircle className="h-3 w-3" />}
          {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
        </span>
        {v.status === 'completed' && v.decision !== 'pending' && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DECISION_COLOR[v.decision]}`}>
            {v.decision.charAt(0).toUpperCase() + v.decision.slice(1)}
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Chef + evaluator row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {chef?.profilePhoto ? (
              <img src={chef.profilePhoto} alt={chef.fullName} className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                <ChefHat className="h-5 w-5 text-brand-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-sm">{chef?.fullName}</p>
              <p className="text-xs text-stone-400">{chef?.user?.phone || chef?.mobile}</p>
            </div>
          </div>
          <div className="text-xs text-stone-400 text-right">
            <p className="font-medium text-stone-600 dark:text-stone-300">Evaluator: {evaluator?.name}</p>
            <p>{evaluator?.phone}</p>
          </div>
        </div>

        {/* Visit details */}
        <div className="flex flex-wrap gap-3 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(v.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {v.scheduledTime && ` at ${v.scheduledTime}`}
          </span>
          {v.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {v.address}
            </span>
          )}
        </div>

        {/* Evaluation results (if completed) */}
        {v.status === 'completed' && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-white/[0.02] space-y-2">
            {v.feedback && (
              <p className="text-xs text-stone-600 dark:text-stone-300 italic">"{v.feedback}"</p>
            )}
            <div className="flex flex-wrap gap-4 text-xs">
              {v.foodRating && (
                <div>
                  <span className="text-stone-400 mr-1">Food:</span>
                  <Stars value={v.foodRating} />
                </div>
              )}
              {v.hygieneRating && (
                <div>
                  <span className="text-stone-400 mr-1">Hygiene:</span>
                  <Stars value={v.hygieneRating} />
                </div>
              )}
              {v.overallRating && (
                <div>
                  <span className="text-stone-400 mr-1">Overall:</span>
                  <Stars value={v.overallRating} />
                </div>
              )}
            </div>
            {v.decision === 'selected' && v.approvedDishes?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">Approved Dishes</p>
                <div className="flex flex-wrap gap-1">
                  {v.approvedDishes.map((d: string) => (
                    <span key={d} className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] text-green-700 dark:bg-green-900/20 dark:text-green-400">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {v.decision === 'rejected' && v.rejectionReason && (
              <p className="text-xs text-red-500"><AlertTriangle className="inline h-3 w-3 mr-1" />{v.rejectionReason}</p>
            )}
          </div>
        )}

        {/* Certificate status */}
        {v.certEmailSentAt && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <Mail className="h-3.5 w-3.5" />
            Certificate sent {new Date(v.certEmailSentAt).toLocaleString('en-IN')}
            {v.certNumber && <span className="font-mono font-bold ml-1">{v.certNumber}</span>}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          {v.status === 'scheduled' && (
            <Button variant="outline" onClick={() => cancel.mutate()} loading={cancel.isPending}
              className="text-xs border-red-200 text-red-600 hover:bg-red-50">
              <XCircle className="mr-1 h-3.5 w-3.5" /> Cancel Visit
            </Button>
          )}
          {v.status === 'completed' && v.decision === 'selected' && !v.certEmailSentAt && (
            <>
              {showCertConfirm ? (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-stone-500">Send certificate to chef's email?</p>
                  <Button onClick={() => sendCert.mutate()} loading={sendCert.isPending} className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    <Send className="h-3.5 w-3.5" /> Yes, Send Now
                  </Button>
                  <Button variant="outline" onClick={() => setShowCertConfirm(false)} className="text-xs">Cancel</Button>
                </div>
              ) : (
                <Button onClick={() => setShowCertConfirm(true)} className="text-xs flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700">
                  <Award className="h-3.5 w-3.5" /> Send Certificate
                </Button>
              )}
            </>
          )}
          {v.status === 'completed' && v.decision === 'selected' && v.certEmailSentAt && (
            <Button onClick={() => sendCert.mutate()} loading={sendCert.isPending} variant="outline" className="text-xs">
              <Mail className="mr-1 h-3.5 w-3.5" /> Resend Certificate
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminVisits() {
  const qc = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

  const { data: visits, isLoading } = useQuery({
    queryKey: ['admin-visits'],
    queryFn: async () => (await api.get('/admin-chef/visits')).data.data,
  });

  if (isLoading) return <PageLoader />;

  const all = visits || [];
  const filtered = filter === 'all' ? all : all.filter((v: any) => v.status === filter);
  const counts = {
    all: all.length,
    scheduled: all.filter((v: any) => v.status === 'scheduled').length,
    completed: all.filter((v: any) => v.status === 'completed').length,
    cancelled: all.filter((v: any) => v.status === 'cancelled').length,
    pendingCert: all.filter((v: any) => v.decision === 'selected' && !v.certEmailSentAt).length,
  };

  return (
    <div className="space-y-5">
      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} qc={qc} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Home Visits</h1>
          <p className="mt-0.5 text-xs text-stone-400">Schedule and track master chef evaluations</p>
        </div>
        <Button onClick={() => setShowSchedule(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Schedule Visit
        </Button>
      </div>

      {/* Alert: certs to send */}
      {counts.pendingCert > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800/40 dark:bg-amber-900/10">
          <Award className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>{counts.pendingCert}</strong> chef{counts.pendingCert > 1 ? 's' : ''} selected but certificate not yet sent
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 dark:border-white/10 p-1 w-fit">
        {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize ${
              filter === s ? 'bg-brand-600 text-white shadow-sm' : 'text-stone-500 hover:bg-slate-100 dark:text-stone-400 dark:hover:bg-white/5'
            }`}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Visit list */}
      <div className="space-y-3">
        {filtered.map((v: any) => <VisitCard key={v._id} v={v} qc={qc} />)}
        {!filtered.length && (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <Calendar className="h-10 w-10 text-stone-300" />
            <p className="text-stone-400">{filter === 'all' ? 'No visits yet' : `No ${filter} visits`}</p>
            {filter === 'all' && (
              <Button onClick={() => setShowSchedule(true)} className="mt-2">
                <Plus className="mr-1.5 h-4 w-4" /> Schedule First Visit
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
