import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export default function AdminSettings() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: async () => (await api.get('/admin/settings')).data.data });
  const [pricing, setPricing] = useState<any>(null);
  useEffect(() => { if (data) setPricing(data.pricing); }, [data]);

  const save = useMutation({
    mutationFn: async () => api.patch('/admin/settings', { pricing }),
    onSuccess: () => toast.success('Settings saved'),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
  if (isLoading || !pricing) return <PageLoader />;

  const fields: [string, string][] = [
    ['hiddenMarginPct', 'Hidden Margin %'], ['chefCommissionPct', 'Chef Commission %'],
    ['platformFee', 'Platform Fee ₹'], ['packingChargePerDish', 'Packing / Dish ₹'],
    ['deliveryCharge', 'Delivery Charge ₹'], ['freeDeliveryThreshold', 'Free Delivery Above ₹'],
    ['gstPct', 'GST %'],
  ];
  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-bold">Pricing & Platform Settings</h1>
      <div className="card grid gap-3 p-5 sm:grid-cols-2">
        {fields.map(([k, label]) => (
          <label key={k} className="text-sm">
            <span className="text-slate-500">{label}</span>
            <input className="input mt-1" type="number" value={pricing[k]} onChange={(e) => setPricing({ ...pricing, [k]: +e.target.value })} />
          </label>
        ))}
        <Button className="sm:col-span-2" loading={save.isPending} onClick={() => save.mutate()}>Save Settings</Button>
      </div>
      <p className="mt-3 text-xs text-slate-400">All pricing rules are applied live to new orders.</p>
    </div>
  );
}
