import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/context/AuthContext';

export default function ChefApply() {
  const nav = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '', mobile: '', email: '', aadhaarNumber: '', panNumber: '',
    cuisineSpecialization: '', deliveryRadiusKm: 5, certificateNumber: '', certificateUrl: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (!form.fullName || !form.mobile) return toast.error('Name and mobile are required');
    if (!form.certificateNumber) return toast.error('Certificate number is required');
    if (!form.certificateUrl.length) return toast.error('Please upload your certificate');
    setLoading(true);
    try {
      await api.post('/chefs/apply', {
        ...form,
        cuisineSpecialization: form.cuisineSpecialization.split(',').map((s) => s.trim()).filter(Boolean),
        certificateUrl: form.certificateUrl[0],
      });
      await refreshUser();
      toast.success('Application submitted! Super Admin will verify your certificate.');
      nav('/account');
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-bold">Become a Home Chef</h1>
      <p className="mb-4 text-sm text-stone-500">Applied → Certificate verification → Approved → Active</p>

      <div className="card space-y-3 p-5">
        <input className="input" placeholder="Full name" onChange={(e) => set('fullName', e.target.value)} />
        <div className="flex gap-2">
          <input className="input" placeholder="Mobile" onChange={(e) => set('mobile', e.target.value)} />
          <input className="input" placeholder="Email" onChange={(e) => set('email', e.target.value)} />
        </div>
        <input className="input" placeholder="Aadhaar number" onChange={(e) => set('aadhaarNumber', e.target.value)} />
        <input className="input" placeholder="PAN number" onChange={(e) => set('panNumber', e.target.value)} />
        <input className="input" placeholder="Cuisine specialization (comma separated)" onChange={(e) => set('cuisineSpecialization', e.target.value)} />
        <input className="input" type="number" placeholder="Delivery radius (km)" onChange={(e) => set('deliveryRadiusKm', +e.target.value)} />

        <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 dark:border-brand-800/40 dark:bg-brand-900/10">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
            <BadgeCheck className="h-4 w-4" /> Certification (required)
          </div>
          <input className="input mb-2" placeholder="Certificate number (e.g. FSSAI / training cert)"
            value={form.certificateNumber} onChange={(e) => set('certificateNumber', e.target.value.toUpperCase())} />
          <p className="mb-2 text-xs text-stone-500">Upload a clear photo/scan of your certificate.</p>
          <ImageUpload value={form.certificateUrl} onChange={(urls) => set('certificateUrl', urls)} folder="certificates" max={1} />
        </div>

        <Button className="w-full" loading={loading} onClick={submit}>Submit Application</Button>
        <p className="text-center text-xs text-stone-400">Your certificate number is verified against our registry by the Super Admin before approval.</p>
      </div>
    </motion.div>
  );
}
