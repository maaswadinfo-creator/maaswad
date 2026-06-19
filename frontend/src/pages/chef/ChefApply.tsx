import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChefHat, ShieldCheck, Upload, Clock, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuth } from '@/context/AuthContext';

const CUISINE_OPTIONS = [
  'Tamil Nadu', 'Chettinad', 'Kongunadu', 'Andhra', 'Telangana', 'Kerala', 'Karnataka',
  'Punjabi', 'Delhi', 'Kashmiri', 'Gujarati', 'Maharashtrian', 'Goan', 'Rajasthani',
  'Bengali', 'Assamese', 'Biryani', 'Street Food', 'Baking & Desserts', 'Chinese',
  'Continental', 'Millet Foods', 'Organic & Healthy', 'Kids Special',
];

export default function ChefApply() {
  const nav = useNavigate();
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: '',
    cuisines: [] as string[],
    yearsOfExperience: '',
    previousExperience: '',
    fssaiAvailable: false,
    fssaiNumber: '',
  });
  const [photo, setPhoto] = useState<string[]>([]);
  const [identityProof, setIdentityProof] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCuisine = (c: string) =>
    set('cuisines', form.cuisines.includes(c) ? form.cuisines.filter((x) => x !== c) : [...form.cuisines, c]);

  const submit = async () => {
    if (!form.fullName.trim()) return toast.error('Full name is required');
    if (!form.mobile.trim()) return toast.error('Mobile number is required');
    if (!form.addressLine1.trim() || !form.city.trim()) return toast.error('Address is required');
    if (!form.cuisines.length) return toast.error('Select at least one cuisine');
    if (!photo.length) return toast.error('Profile photo is required');
    setLoading(true);
    try {
      await api.post('/chefs/apply', {
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email,
        address: { line1: form.addressLine1, city: form.city, state: form.state, pincode: form.pincode },
        cuisineSpecialization: form.cuisines,
        yearsOfExperience: Number(form.yearsOfExperience) || 0,
        previousExperience: form.previousExperience,
        fssaiAvailable: form.fssaiAvailable,
        fssaiNumber: form.fssaiNumber,
        identityProofUrl: identityProof[0] || null,
        profilePhoto: photo[0],
      });
      await refreshUser();
      toast.success('Application submitted! Admin will review and get back to you.');
      nav('/');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl pb-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/30">
          <ChefHat className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Become a Home Chef</h1>
          <p className="text-sm text-stone-500">Share your love for food with the Maaswad community</p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="mb-6 flex items-center gap-0 text-xs font-medium">
        {['Apply', 'Admin Review', 'Get Certificate', 'Upload & Activate'].map((step, i) => (
          <div key={step} className="flex items-center">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? 'bg-brand-600 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-400'}`}>{i + 1}</span>
            <span className={`ml-1.5 ${i === 0 ? 'text-brand-700 dark:text-brand-400' : 'text-stone-400'}`}>{step}</span>
            {i < 3 && <span className="mx-2 text-stone-300">→</span>}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">1</span>Basic Information</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className="input" placeholder="Full name *" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
            <input className="input" placeholder="Mobile number *" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
            <input className="input" placeholder="Email address" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
        </div>

        {/* Address */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">2</span>Kitchen Address</h2>
          <input className="input" placeholder="Address line *" value={form.addressLine1} onChange={(e) => set('addressLine1', e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <input className="input col-span-1" placeholder="City *" value={form.city} onChange={(e) => set('city', e.target.value)} />
            <input className="input col-span-1" placeholder="State" value={form.state} onChange={(e) => set('state', e.target.value)} />
            <input className="input col-span-1" placeholder="Pincode" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
          </div>
        </div>

        {/* Cuisines */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Utensils className="h-4 w-4 text-brand-600" />Cuisine Specializations *</h2>
          <p className="text-xs text-stone-500">Select all cuisines you're well versed in</p>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCuisine(c)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                  form.cuisines.includes(c)
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-black/10 bg-white text-stone-600 dark:border-white/10 dark:bg-charcoal-900 dark:text-stone-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {form.cuisines.length > 0 && (
            <p className="text-xs text-brand-600 font-medium">{form.cuisines.length} selected: {form.cuisines.join(', ')}</p>
          )}
        </div>

        {/* Experience */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-brand-600" />Cooking Experience</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-stone-500">Years of cooking experience</label>
              <input className="input" type="number" min="0" placeholder="e.g. 5" value={form.yearsOfExperience} onChange={(e) => set('yearsOfExperience', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-stone-500">Previous cooking experience (restaurants, catering, etc.)</label>
            <textarea className="input min-h-[90px] resize-none" placeholder="Describe your cooking background, training, or any prior professional experience..." value={form.previousExperience} onChange={(e) => set('previousExperience', e.target.value)} />
          </div>
        </div>

        {/* FSSAI */}
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" />Food Safety (FSSAI)</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.fssaiAvailable}
              onChange={(e) => set('fssaiAvailable', e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-brand-600 accent-brand-600"
            />
            <span className="text-sm">I have a valid FSSAI (Food Safety and Standards Authority of India) license</span>
          </label>
          {form.fssaiAvailable && (
            <input className="input" placeholder="FSSAI license number (optional)" value={form.fssaiNumber} onChange={(e) => set('fssaiNumber', e.target.value)} />
          )}
        </div>

        {/* Photos */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4 text-brand-600" />Photos & Documents</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">Profile photo <span className="text-red-500">*</span></label>
            <ImageUpload value={photo} onChange={setPhoto} folder="chef-photos" max={1} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Identity proof <span className="text-stone-400 font-normal text-xs">(optional — Aadhaar, PAN, or Driving License)</span></label>
            <p className="mb-2 text-xs text-stone-500">Upload a clear photo or scan. This is securely stored and only visible to admins.</p>
            <ImageUpload value={identityProof} onChange={setIdentityProof} folder="identity-proofs" max={1} />
          </div>
        </div>

        <Button className="w-full" size="lg" loading={loading} onClick={submit}>
          Submit Application
        </Button>
        <p className="text-center text-xs text-stone-400">
          After review, admin will generate your chef certificate and email it to you. Upload it to activate your account.
        </p>
      </div>
    </motion.div>
  );
}
