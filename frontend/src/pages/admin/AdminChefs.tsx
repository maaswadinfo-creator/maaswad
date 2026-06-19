import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, BadgeX, FileText, ChefHat, Award, Users, CheckCircle2,
  Clock, XCircle, UserCheck, Mail, ChevronDown, ChevronUp, Sparkles,
  Phone, MapPin, Star, Shield, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

const STATUS_COLOR: Record<string, string> = {
  applied:              'bg-amber-100 text-amber-700 border-amber-200',
  under_review:         'bg-blue-100 text-blue-700 border-blue-200',
  pending_certificate:  'bg-purple-100 text-purple-700 border-purple-200',
  certificate_uploaded: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  approved:             'bg-green-100 text-green-700 border-green-200',
  active:               'bg-emerald-100 text-emerald-700 border-emerald-200',
  suspended:            'bg-red-100 text-red-700 border-red-200',
  rejected:             'bg-stone-100 text-stone-500 border-stone-200',
};

const STATUS_ICON: Record<string, typeof Clock> = {
  applied:              Clock,
  under_review:         UserCheck,
  pending_certificate:  Mail,
  certificate_uploaded: FileText,
  approved:             CheckCircle2,
  active:               BadgeCheck,
  suspended:            XCircle,
  rejected:             XCircle,
};

const STATUS_LABEL: Record<string, string> = {
  applied:              'New Application',
  under_review:         'Under Review',
  pending_certificate:  'Certificate Sent',
  certificate_uploaded: 'Certificate Uploaded',
  approved:             'Approved',
  active:               'Active Chef',
  suspended:            'Suspended',
  rejected:             'Rejected',
};

const CUISINE_OPTIONS = [
  'Tamil Nadu', 'Chettinad', 'Kongunadu', 'Andhra', 'Telangana', 'Kerala', 'Karnataka',
  'Punjabi', 'Delhi', 'Kashmiri', 'Gujarati', 'Maharashtrian', 'Goan', 'Rajasthani',
  'Bengali', 'Biryani', 'Street Food', 'Baking & Desserts', 'Chinese', 'Continental',
  'Millet Foods', 'Organic & Healthy', 'Kids Special',
];

// ── Pipeline steps displayed at top ──────────────────────────────────────────
const PIPELINE_STEPS = [
  { key: 'applied', label: 'Applied' },
  { key: 'under_review', label: 'Review' },
  { key: 'pending_certificate', label: 'Cert Sent' },
  { key: 'certificate_uploaded', label: 'Cert Uploaded' },
  { key: 'active', label: 'Active' },
];

// ── Certificate Generation Panel — shown prominently ────────────────────────
function CertPanel({ c, activeChefs, qc }: { c: any; activeChefs: any[]; qc: any }) {
  const [selectedDishes, setSelectedDishes] = useState<string[]>(c.cuisineSpecialization || []);
  const toggleDish = (d: string) =>
    setSelectedDishes((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const assignMentor = useMutation({
    mutationFn: (mentorId: string) => api.post(`/admin/chefs/${c._id}/assign-mentor`, { mentorId }),
    onSuccess: () => { toast.success('Mentor assigned'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const generateCert = useMutation({
    mutationFn: () => api.post(`/admin/chefs/${c._id}/generate-certificate`, { approvedDishes: selectedDishes }),
    onSuccess: () => { toast.success('Certificate generated & emailed! 📜'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      {/* Mentor assignment */}
      {activeChefs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Assign Mentor Chef <span className="font-normal text-stone-300 normal-case">(optional)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {activeChefs.map((m: any) => (
              <button
                key={m._id}
                onClick={() => assignMentor.mutate(m._id)}
                disabled={assignMentor.isPending}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                  c.mentorChef === m._id
                    ? 'border-purple-400 bg-purple-50 text-purple-700 font-medium'
                    : 'border-black/10 bg-white text-stone-600 hover:border-purple-300 dark:border-white/10 dark:bg-charcoal-900 dark:text-stone-300'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> {m.fullName}
                {c.mentorChef === m._id && <BadgeCheck className="h-3.5 w-3.5 text-purple-500" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cuisine picker */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Select cuisines to certify <span className="font-normal text-stone-300 normal-case">({selectedDishes.length} selected)</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CUISINE_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDish(d)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                selectedDishes.includes(d)
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'border-black/10 bg-white text-stone-500 hover:border-brand-300 dark:border-white/10 dark:bg-charcoal-900'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="flex items-center gap-3">
        <Button
          loading={generateCert.isPending}
          onClick={() => selectedDishes.length ? generateCert.mutate() : toast.error('Select at least one cuisine first')}
          className="flex items-center gap-2"
        >
          <Award className="h-4 w-4" /> Generate &amp; Email Certificate
        </Button>
        {c.certEmailSentAt && (
          <p className="text-xs text-stone-400">
            Last sent: {new Date(c.certEmailSentAt).toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Chef card ────────────────────────────────────────────────────────────────
function ChefCard({ c, activeChefs, qc }: { c: any; activeChefs: any[]; qc: any }) {
  const [expanded, setExpanded] = useState(false);

  // Auto-expand for chefs needing action
  const needsAction = ['applied', 'under_review', 'certificate_uploaded'].includes(c.status);

  const review = useMutation({
    mutationFn: ({ action, reason }: { action: string; reason?: string }) =>
      api.patch(`/admin/chefs/${c._id}/review`, { action, reason }),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const finalApprove = useMutation({
    mutationFn: () => api.post(`/admin/chefs/${c._id}/final-approve`, {}),
    onSuccess: () => { toast.success('Chef activated! 🎉'); qc.invalidateQueries({ queryKey: ['admin-chefs'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const StatusIcon = STATUS_ICON[c.status] || Clock;

  // Left border accent color by status
  const accentBorder: Record<string, string> = {
    applied:              'border-l-amber-400',
    under_review:         'border-l-blue-400',
    pending_certificate:  'border-l-purple-400',
    certificate_uploaded: 'border-l-indigo-500',
    active:               'border-l-emerald-500',
    suspended:            'border-l-red-400',
    rejected:             'border-l-stone-300',
  };

  return (
    <div className={`card overflow-hidden border-l-4 ${accentBorder[c.status] || 'border-l-stone-200'}`}>
      {/* ── Card header ── */}
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {c.profilePhoto ? (
              <img src={c.profilePhoto} alt={c.fullName} className="h-12 w-12 rounded-xl object-cover ring-2 ring-brand-100" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/40 dark:to-brand-800/30">
                <ChefHat className="h-6 w-6 text-brand-600 dark:text-brand-400" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{c.fullName}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.user?.phone || c.mobile}</span>
                {(c.address?.city) && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.address.city}{c.address.state ? `, ${c.address.state}` : ''}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[c.status] || 'bg-stone-100 text-stone-500 border-stone-200'}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {STATUS_LABEL[c.status] || c.status}
            </span>
            <button
              onClick={() => setExpanded((s) => !s)}
              className="rounded-lg border border-slate-200 p-1.5 text-stone-400 transition hover:bg-slate-50 hover:text-slate-600 dark:border-white/10 dark:hover:bg-white/5"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Quick info chips */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {c.cuisineSpecialization?.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
              🍽 {c.cuisineSpecialization.slice(0, 3).join(', ')}{c.cuisineSpecialization.length > 3 ? ` +${c.cuisineSpecialization.length - 3}` : ''}
            </span>
          )}
          {c.yearsOfExperience > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-white/5 dark:text-stone-300">
              <Star className="h-3 w-3" /> {c.yearsOfExperience}yr exp
            </span>
          )}
          {c.fssaiAvailable && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              <Shield className="h-3 w-3" /> FSSAI
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

        {/* ── PROMINENT ACTION AREAS (always visible, no expand needed) ── */}

        {/* ACTION: Generate certificate — visible for applied + under_review */}
        {['applied', 'under_review'].includes(c.status) && (
          <div className="mt-4 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-purple-50 p-4 dark:border-brand-800/40 dark:from-brand-900/20 dark:to-purple-900/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/40">
                <Award className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-800 dark:text-brand-200">Generate Chef Certificate</p>
                <p className="text-xs text-brand-600/70 dark:text-brand-400/70">Select cuisines and email the certificate to the chef</p>
              </div>
            </div>
            <CertPanel c={c} activeChefs={activeChefs} qc={qc} />
          </div>
        )}

        {/* ACTION: Final activate — visible for certificate_uploaded */}
        {c.status === 'certificate_uploaded' && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800/40 dark:bg-indigo-900/10">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Certificate Uploaded — Ready to Activate</p>
                <p className="text-xs text-indigo-600/70">The chef has uploaded their certificate. Review and activate their account.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {c.certificateUrl && (
                <a href={c.certificateUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800/40 dark:bg-charcoal-900 dark:text-indigo-400">
                  <FileText className="h-3.5 w-3.5" /> View Certificate
                </a>
              )}
              <Button onClick={() => finalApprove.mutate()} loading={finalApprove.isPending} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Sparkles className="h-4 w-4" /> Activate Chef
              </Button>
            </div>
          </div>
        )}

        {/* Pending certificate status info */}
        {c.status === 'pending_certificate' && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 p-3.5 dark:border-purple-800/30 dark:bg-purple-900/10">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Certificate email sent</p>
              <p className="text-xs text-purple-600/70 dark:text-purple-400/60">Waiting for chef to upload the certificate. Cert no: <span className="font-mono font-semibold">{c.generatedCertNumber}</span></p>
              {c.certEmailSentAt && (
                <p className="mt-0.5 text-xs text-purple-400">Sent {new Date(c.certEmailSentAt).toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="border-t border-black/5 bg-slate-50/50 p-4 dark:border-white/5 dark:bg-white/[0.02] space-y-4">
          {c.previousExperience && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Previous Experience</p>
              <p className="text-sm text-stone-700 dark:text-stone-300">{c.previousExperience}</p>
            </div>
          )}

          {c.identityProofUrl && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Identity Proof</p>
              <a href={c.identityProofUrl} target="_blank" rel="noreferrer">
                <img src={c.identityProofUrl} alt="identity" className="h-24 rounded-lg border object-cover transition hover:opacity-90" />
              </a>
            </div>
          )}

          {c.user?.email && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">Email</p>
              <p className="text-sm text-stone-700 dark:text-stone-300">{c.user.email}</p>
            </div>
          )}

          {/* Reject / Suspend actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {!['active', 'approved', 'rejected'].includes(c.status) && (
              <Button
                variant="outline"
                onClick={() => review.mutate({ action: 'reject' })}
                loading={review.isPending}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800/40 dark:text-red-400"
              >
                <XCircle className="mr-1.5 h-4 w-4" /> Reject Application
              </Button>
            )}
            {c.status === 'active' && (
              <Button
                variant="outline"
                onClick={() => review.mutate({ action: 'suspend' })}
                loading={review.isPending}
                className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800/40 dark:text-amber-400"
              >
                <AlertTriangle className="mr-1.5 h-4 w-4" /> Suspend Chef
              </Button>
            )}
            {c.status === 'suspended' && (
              <Button onClick={() => review.mutate({ action: 'approve' })} loading={review.isPending}>
                Reinstate Chef
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
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

  const applications = (chefs || []).filter((c: any) => c.status !== 'active');
  const active = (chefs || []).filter((c: any) => c.status === 'active');
  const tabChefs = tab === 'applications' ? applications : active;

  // Count chefs needing action
  const needsCert = applications.filter((c: any) => ['applied', 'under_review'].includes(c.status)).length;
  const needsActivation = applications.filter((c: any) => c.status === 'certificate_uploaded').length;

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Chef Management</h1>
          <p className="mt-0.5 text-xs text-stone-400">Manage chef applications, certificates, and onboarding</p>
        </div>

        {/* Action alerts */}
        <div className="flex flex-wrap gap-2">
          {needsCert > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              <Award className="h-3.5 w-3.5" /> {needsCert} need certificate
            </span>
          )}
          {needsActivation > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" /> {needsActivation} ready to activate
            </span>
          )}
        </div>
      </div>

      {/* Pipeline progress bar */}
      <div className="card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-stone-400">Onboarding Pipeline</p>
        <div className="flex items-center gap-1 overflow-x-auto">
          {PIPELINE_STEPS.map((step, i) => {
            const count = (chefs || []).filter((c: any) => c.status === step.key).length;
            const colors: Record<string, string> = {
              applied:              'bg-amber-100 text-amber-700 border-amber-200',
              under_review:         'bg-blue-100 text-blue-700 border-blue-200',
              pending_certificate:  'bg-purple-100 text-purple-700 border-purple-200',
              certificate_uploaded: 'bg-indigo-100 text-indigo-700 border-indigo-200',
              active:               'bg-emerald-100 text-emerald-700 border-emerald-200',
            };
            return (
              <div key={step.key} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap ${colors[step.key]}`}>
                  <span>{step.label}</span>
                  <span className="rounded-full bg-white/60 px-1.5 py-0.5 font-bold text-[11px]">{count}</span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <span className="text-stone-200 dark:text-stone-600">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden text-sm w-fit">
        {(['applications', 'active'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 font-medium transition ${
              tab === t
                ? 'bg-brand-600 text-white'
                : 'bg-white text-stone-600 hover:bg-slate-50 dark:bg-charcoal-900 dark:text-stone-300 dark:hover:bg-white/5'
            }`}
          >
            {t === 'applications' ? `Applications (${applications.length})` : `Active Chefs (${active.length})`}
          </button>
        ))}
      </div>

      {/* Chef list */}
      <div className="space-y-3">
        {tabChefs.map((c: any) => (
          <ChefCard key={c._id} c={c} activeChefs={activeChefs} qc={qc} />
        ))}
        {!tabChefs.length && (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5">
              <ChefHat className="h-8 w-8 text-stone-300" />
            </div>
            <div>
              <p className="font-medium text-stone-500">{tab === 'applications' ? 'No pending applications' : 'No active chefs yet'}</p>
              <p className="mt-0.5 text-xs text-stone-300">{tab === 'applications' ? 'New applications will appear here' : 'Chefs become active after completing onboarding'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
