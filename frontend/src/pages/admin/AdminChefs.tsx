import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, BadgeX, FileText, ChefHat, Award, Users, CheckCircle2,
  Clock, XCircle, UserCheck, Mail, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { ImageUpload } from '@/components/ui/ImageUpload';

const STATUS_COLOR: Record<string, string> = {
  applied: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  pending_certificate: 'bg-purple-100 text-purple-700',
  certificate_uploaded: 'bg-indigo-100 text-indigo-700',
  approved: 'bg-green-100 text-green-700',
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-700',
  rejected: 'bg-stone-100 text-stone-500',
};

const STATUS_ICON: Record<string, typeof Clock> = {
  applied: Clock,
  under_review: UserCheck,
  pending_certificate: Mail,
  certificate_uploaded: FileText,
  approved: CheckCircle2,
  active: BadgeCheck,
  suspended: XCircle,
  rejected: XCircle,
};

const CUISINE_OPTIONS = [
  'Tamil Nadu', 'Chettinad', 'Kongunadu', 'Andhra', 'Telangana', 'Kerala', 'Karnataka',
  'Punjabi', 'Delhi', 'Kashmiri', 'Gujarati', 'Maharashtrian', 'Goan', 'Rajasthani',
  'Bengali', 'Biryani', 'Street Food', 'Baking & Desserts', 'Chinese', 'Continental',
  'Millet Foods', 'Organic & Healthy', 'Kids Special',
];

function ChefCard({ c, activeChefs, qc }: { c: any; activeChefs: any[]; qc: any }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDishes, setSelectedDishes] = useState<string[]>(c.cuisineSpecialization || []);
  const [certUrl, setCertUrl] = useState<string[]>(c.certificateUrl ? [c.certificateUrl] : []);

  const review = useMutation({
    mutationFn: ({ action, reason }: { action: string; reason?: string }) =>
      api.patch(`/admin/chefs/${c._id}/review`, { action, reason }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const assignMentor = useMutation({
    mutationFn: (mentorId: string) => api.post(`/admin/chefs/${c._id}/assign-mentor`, { mentorId }),
    onSuccess: () => { toast.success('Mentor assigned'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const generateCert = useMutation({
    mutationFn: () => api.post(`/admin/chefs/${c._id}/generate-certificate`, { approvedDishes: selectedDishes }),
    onSuccess: () => { toast.success('Certificate generated & emailed!'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const finalApprove = useMutation({
    mutationFn: () => api.post(`/admin/chefs/${c._id}/final-approve`, {}),
    onSuccess: () => { toast.success('Chef activated! 🎉'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const toggleDish = (d: string) =>
    setSelectedDishes((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const StatusIcon = STATUS_ICON[c.status] || Clock;

  return (
    <div className="card p-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {c.profilePhoto ? (
            <img src={c.profilePhoto} alt={c.fullName} className="h-12 w-12 rounded-xl object-cover ring-2 ring-brand-100" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/30">
              <ChefHat className="h-6 w-6 text-brand-600" />
            </div>
          )}
          <div>
            <p className="font-semibold">{c.fullName}</p>
            <p className="text-xs text-stone-400">{c.user?.phone || c.mobile} · {c.user?.email || c.email}</p>
            <p className="text-xs text-stone-400">{c.address?.city}{c.address?.state ? `, ${c.address.state}` : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge flex items-center gap-1 capitalize ${STATUS_COLOR[c.status] || 'bg-stone-100 text-stone-500'}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {c.status.replace(/_/g, ' ')}
          </span>
          <button onClick={() => setExpanded((s) => !s)} className="rounded-lg border p-1.5 text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Quick info chips */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {c.cuisineSpecialization?.length > 0 && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
            🍽 {c.cuisineSpecialization.slice(0, 3).join(', ')}{c.cuisineSpecialization.length > 3 ? ` +${c.cuisineSpecialization.length - 3}` : ''}
          </span>
        )}
        {c.yearsOfExperience > 0 && (
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-600 dark:bg-white/5 dark:text-stone-300">
            {c.yearsOfExperience}yr exp
          </span>
        )}
        {c.fssaiAvailable && (
          <span className="rounded-full bg-green-50 px-2.5 py-1 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            ✓ FSSAI
          </span>
        )}
        {c.mentorChef && (
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
            👨‍🍳 Mentor assigned
          </span>
        )}
        {c.generatedCertNumber && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 font-mono text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
            📜 {c.generatedCertNumber}
          </span>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-black/5 pt-4 dark:border-white/5">
          {/* Application details */}
          {c.previousExperience && (
            <div>
              <p className="mb-1 text-xs font-semibold text-stone-500 uppercase tracking-wide">Previous Experience</p>
              <p className="text-sm text-stone-700 dark:text-stone-300">{c.previousExperience}</p>
            </div>
          )}

          {/* Identity proof */}
          {c.identityProofUrl && (
            <div>
              <p className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Identity Proof</p>
              <a href={c.identityProofUrl} target="_blank" rel="noreferrer">
                <img src={c.identityProofUrl} alt="identity" className="h-24 rounded-lg border object-cover" />
              </a>
            </div>
          )}

          {/* Uploaded certificate (from chef) */}
          {c.certificateUrl && (
            <div>
              <p className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Uploaded Certificate</p>
              <a href={c.certificateUrl} target="_blank" rel="noreferrer">
                <img src={c.certificateUrl} alt="certificate" className="h-32 rounded-lg border object-cover" />
              </a>
            </div>
          )}

          {/* STEP: Assign mentor (for applied / under_review) */}
          {['applied', 'under_review'].includes(c.status) && activeChefs.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Assign Mentor Chef (optional)</p>
              <div className="flex flex-wrap gap-2">
                {activeChefs.map((m: any) => (
                  <button
                    key={m._id}
                    onClick={() => assignMentor.mutate(m._id)}
                    disabled={assignMentor.isPending}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                      c.mentorChef === m._id
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-black/10 bg-white text-stone-600 hover:border-purple-300 dark:border-white/10 dark:bg-charcoal-900 dark:text-stone-300'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" /> {m.fullName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Generate certificate (for applied / under_review) */}
          {['applied', 'under_review'].includes(c.status) && (
            <div>
              <p className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">Select Approved Cuisines for Certificate</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {CUISINE_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDish(d)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      selectedDishes.includes(d)
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-black/10 bg-white text-stone-500 dark:border-white/10 dark:bg-charcoal-900'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <Button
                loading={generateCert.isPending}
                onClick={() => selectedDishes.length ? generateCert.mutate() : toast.error('Select at least one cuisine')}
                className="flex items-center gap-2"
              >
                <Award className="h-4 w-4" /> Generate & Email Certificate
              </Button>
              {c.certEmailSentAt && (
                <p className="mt-2 text-xs text-stone-400">Certificate last sent: {new Date(c.certEmailSentAt).toLocaleString('en-IN')}</p>
              )}
            </div>
          )}

          {/* STEP: Final approve (after chef uploads cert) */}
          {c.status === 'certificate_uploaded' && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/40 dark:bg-indigo-900/10">
              <p className="mb-3 font-semibold text-indigo-800 dark:text-indigo-300">
                ✅ Chef has uploaded their certificate — ready for final activation
              </p>
              <Button onClick={() => finalApprove.mutate()} loading={finalApprove.isPending} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Activate Chef Account
              </Button>
            </div>
          )}

          {/* Reject / Suspend */}
          <div className="flex flex-wrap gap-2 border-t border-black/5 pt-3 dark:border-white/5">
            {!['active', 'approved', 'rejected'].includes(c.status) && (
              <Button variant="outline" onClick={() => review.mutate({ action: 'reject' })} loading={review.isPending}>
                <XCircle className="mr-1.5 h-4 w-4 text-red-500" /> Reject
              </Button>
            )}
            {c.status === 'active' && (
              <Button variant="outline" onClick={() => review.mutate({ action: 'suspend' })} loading={review.isPending}>
                Suspend
              </Button>
            )}
            {c.status === 'suspended' && (
              <Button onClick={() => review.mutate({ action: 'approve' })} loading={review.isPending}>
                Reinstate
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminChefs() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'applications' | 'active'>('applications');

  const { data: chefs, isLoading } = useQuery({
    queryKey: ['admin-chefs'],
    queryFn: async () => (await api.get('/admin/chefs')).data.data,
  });
  const { data: activeChefs = [] } = useQuery({
    queryKey: ['admin-active-chefs'],
    queryFn: async () => (await api.get('/admin/chefs/active')).data.data,
  });

  if (isLoading) return <PageLoader />;

  const applications = (chefs || []).filter((c: any) => !['active'].includes(c.status));
  const active = (chefs || []).filter((c: any) => c.status === 'active');

  const tabChefs = tab === 'applications' ? applications : active;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Chef Management</h1>
        <div className="flex rounded-xl border border-black/10 dark:border-white/10 overflow-hidden text-sm">
          <button
            onClick={() => setTab('applications')}
            className={`px-4 py-2 font-medium transition ${tab === 'applications' ? 'bg-brand-600 text-white' : 'bg-white text-stone-600 dark:bg-charcoal-900 dark:text-stone-300'}`}
          >
            Applications ({applications.length})
          </button>
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-2 font-medium transition ${tab === 'active' ? 'bg-brand-600 text-white' : 'bg-white text-stone-600 dark:bg-charcoal-900 dark:text-stone-300'}`}
          >
            Active Chefs ({active.length})
          </button>
        </div>
      </div>

      {/* Pipeline legend */}
      {tab === 'applications' && (
        <div className="card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Onboarding Pipeline</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {[
              { status: 'applied', label: 'New Application' },
              { status: 'under_review', label: 'Under Review' },
              { status: 'pending_certificate', label: 'Certificate Sent' },
              { status: 'certificate_uploaded', label: 'Cert Uploaded' },
              { status: 'active', label: 'Active' },
            ].map((s, i) => (
              <div key={s.status} className="flex items-center gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLOR[s.status]}`}>{s.label}</span>
                {i < 4 && <span className="text-stone-300">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {tabChefs.map((c: any) => (
          <ChefCard key={c._id} c={c} activeChefs={activeChefs} qc={qc} />
        ))}
        {!tabChefs.length && (
          <div className="card flex flex-col items-center gap-2 p-10 text-center">
            <ChefHat className="h-10 w-10 text-stone-300" />
            <p className="text-stone-400">{tab === 'applications' ? 'No pending applications' : 'No active chefs yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
