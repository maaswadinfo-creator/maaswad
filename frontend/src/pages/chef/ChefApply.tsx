import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export default function ChefApply() {
  const nav = useNavigate();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ fullName: '', mobile: '', email: '', aadhaarNumber: '', panNumber: '', cuisineSpecialization: '', deliveryRadiusKm: 5 });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (!form.fullName || !form.mobile) return toast.error('Name and mobile required');
    setLoading(true);
    try {
      await api.post('/chefs/apply', { ...form, cuisineSpecialization: form.cuisineSpecialization.split(',').map((s) => s.trim()).filter(Boolean) });
      await refreshUser();
      toast.success('Application submitted! Operations will review.');
      nav('/account');
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-xl font-bold">Become a Home Chef</h1>
      <p className="mb-4 text-sm text-slate-500">Applied → Verification → Operations Review → Approved → Active</p>
      <div className="card space-y-3 p-5">
        <input className="input" placeholder="Full name" onChange={(e) => set('fullName', e.target.value)} />
        <input className="input" placeholder="Mobile" onChange={(e) => set('mobile', e.target.value)} />
        <input className="input" placeholder="Email" onChange={(e) => set('email', e.target.value)} />
        <input className="input" placeholder="Aadhaar number" onChange={(e) => set('aadhaarNumber', e.target.value)} />
        <input className="input" placeholder="PAN number" onChange={(e) => set('panNumber', e.target.value)} />
        <input className="input" placeholder="Cuisine specialization (comma separated)" onChange={(e) => set('cuisineSpecialization', e.target.value)} />
        <input className="input" type="number" placeholder="Delivery radius (km)" onChange={(e) => set('deliveryRadiusKm', +e.target.value)} />
        <Button className="w-full" loading={loading} onClick={submit}>Submit Application</Button>
      </div>
    </div>
  );
}
