import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { IndianRupee, ClipboardList, Star, Wallet, Upload, Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { stagger, fadeUp } from '@/lib/motion';

function CertUploadBanner({ profile, onUploaded }: { profile: any; onUploaded: () => void }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!urls.length) return toast.error('Please upload your certificate first');
    setLoading(true);
    try {
      await api.patch('/chefs/me/certificate', { certificateUrl: urls[0] });
      toast.success('Certificate uploaded! Admin will verify and activate your account.');
      onUploaded();
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };

  if (profile?.status === 'pending_certificate') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="card border-2 border-purple-200 bg-purple-50 p-5 dark:border-purple-800/40 dark:bg-purple-900/10">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <Mail className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 dark:text-purple-200">Your Certificate Has Been Emailed!</h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-0.5">
              Check your email for your Maaswad Chef Certificate (cert number: <strong className="font-mono">{profile.generatedCertNumber}</strong>).
              Upload it below to activate your chef account.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <ImageUpload value={urls} onChange={setUrls} folder="chef-certificates" max={1} />
          <Button onClick={upload} loading={loading} className="w-full flex items-center justify-center gap-2">
            <Upload className="h-4 w-4" /> Upload Certificate & Activate
          </Button>
        </div>
      </motion.div>
    );
  }

  if (profile?.status === 'certificate_uploaded') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="card border-2 border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800/40 dark:bg-indigo-900/10">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-indigo-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Certificate Uploaded — Pending Admin Approval</h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-0.5">
              Our admin team will verify your certificate and activate your account shortly. You'll receive an email when approved.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (profile?.status === 'applied' || profile?.status === 'under_review') {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="card border-2 border-amber-200 bg-amber-50 p-5 dark:border-amber-800/40 dark:bg-amber-900/10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
            <ClipboardList className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">Application Under Review</h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              Our team is reviewing your application. We'll email your chef certificate once approved.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}

export default function ChefDashboard() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ['chef-profile'],
    queryFn: async () => (await api.get('/chefs/me')).data.data,
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ['chef-dashboard'],
    queryFn: async () => (await api.get('/chefs/dashboard')).data.data,
    enabled: profile?.status === 'active',
  });

  if (isLoading && profile?.status === 'active') {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  // Show onboarding status banners for non-active chefs
  if (profile && profile.status !== 'active') {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Chef Dashboard</h1>
        <CertUploadBanner profile={profile} onUploaded={() => qc.invalidateQueries({ queryKey: ['chef-profile'] })} />
      </div>
    );
  }

  if (error || !data) return <p className="text-slate-500">Could not load dashboard data.</p>;

  const stats = [
    { label: "Today's Sales", value: data.dailySales, icon: IndianRupee, money: true },
    { label: 'Monthly Revenue', value: data.monthlyRevenue, icon: Wallet, money: true },
    { label: 'Pending Orders', value: data.pendingOrders, icon: ClipboardList },
    { label: 'Active Orders', value: data.activeOrders, icon: ClipboardList },
  ];
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Chef Dashboard</h1>
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <motion.div key={s.label} variants={fadeUp} whileHover={{ y: -4 }} className="card p-4">
            <s.icon className="h-5 w-5 text-brand-500" />
            <p className="mt-2 text-2xl font-extrabold text-brand-700 dark:text-brand-400">
              {s.money && '₹'}<AnimatedNumber value={s.value} />
            </p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </motion.div>
        ))}
        <motion.div variants={fadeUp} whileHover={{ y: -4 }} className="card p-4">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <p className="mt-2 text-2xl font-extrabold text-brand-700 dark:text-brand-400">{data.rating?.avg || 0} ★</p>
          <p className="text-xs text-slate-400">Rating</p>
        </motion.div>
      </motion.div>

      <div className="card mt-5 p-4">
        <h2 className="mb-2 font-semibold">Recent Payouts</h2>
        {data.payoutStatus?.length ? data.payoutStatus.map((p: any) => (
          <div key={p._id} className="flex justify-between border-b border-slate-100 py-2 text-sm last:border-0 dark:border-white/5">
            <span className="capitalize">{p.status}</span><span>{inr(p.netEarnings)}</span>
          </div>
        )) : <p className="text-sm text-slate-400">No settlements yet.</p>}
      </div>
    </div>
  );
}
