import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { inr } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/cartStore';
import type { OrderPricing } from '@/types';

export default function Checkout() {
  const { items, clear } = useCart();
  const nav = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [address, setAddress] = useState({ line1: '', city: '', pincode: '', instructions: '' });
  const [pricing, setPricing] = useState<OrderPricing | null>(null);
  const [placing, setPlacing] = useState(false);

  const itemPayload = items.map((i) => ({ dishId: i.dish._id, qty: i.qty }));

  const { refetch, isFetching } = useQuery({
    queryKey: ['quote', JSON.stringify(itemPayload), appliedCoupon],
    queryFn: async () => {
      const { data } = await api.post('/orders/quote', { items: itemPayload, couponCode: appliedCoupon || undefined });
      setPricing(data.data);
      return data.data as OrderPricing;
    },
    enabled: items.length > 0,
  });

  useEffect(() => { if (items.length) refetch(); /* eslint-disable-next-line */ }, [appliedCoupon]);

  if (!items.length) { nav('/'); return null; }

  const placeOrder = async () => {
    if (!address.line1 || !address.pincode) return toast.error('Enter delivery address');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders/checkout', {
        items: itemPayload, couponCode: appliedCoupon || undefined,
        deliveryAddress: { ...address, location: { type: 'Point', coordinates: [0, 0] } },
      });
      const orderId = data.data.order._id;
      // Dummy payment confirm
      await api.post(`/orders/${orderId}/pay`);
      clear();
      toast.success('Order placed!');
      nav(`/orders/${orderId}`);
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setPlacing(false); }
  };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Checkout</h1>

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">Delivery Address</h2>
        <input className="input mb-2" placeholder="Address line" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} />
        <div className="mb-2 flex gap-2">
          <input className="input" placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          <input className="input" placeholder="Pincode" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
        </div>
        <input className="input" placeholder="Delivery instructions (optional)" value={address.instructions} onChange={(e) => setAddress({ ...address, instructions: e.target.value })} />
      </div>

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">Coupon</h2>
        <div className="flex gap-2">
          <input className="input" placeholder="WELCOME50" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
          <Button variant="outline" onClick={() => setAppliedCoupon(coupon)}>Apply</Button>
        </div>
        {appliedCoupon && <p className="mt-2 text-xs text-green-600">Applied: {appliedCoupon}</p>}
      </div>

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">Bill Summary</h2>
        {isFetching || !pricing ? <p className="text-sm text-slate-400">Calculating…</p> : (
          <div className="space-y-1 text-sm">
            <Row label="Food total" value={pricing.displayedFoodTotal} />
            <Row label="Packing charge" value={pricing.packingCharge} />
            <Row label="Delivery" value={pricing.deliveryCharge} />
            <Row label="Platform fee" value={pricing.platformFee} />
            {pricing.discounts > 0 && <Row label="Discount" value={-pricing.discounts} green />}
            <div className="my-2 border-t border-dashed" />
            <div className="flex justify-between font-bold text-brand-700"><span>To Pay</span><span>{inr(pricing.customerTotal)}</span></div>
          </div>
        )}
      </div>

      <Button className="w-full" loading={placing} onClick={placeOrder}>
        Pay {pricing ? inr(pricing.customerTotal) : ''} (Dummy Gateway)
      </Button>
      <p className="text-center text-xs text-slate-400">Phase 1 uses a dummy gateway. Razorpay-ready architecture.</p>
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: number; green?: boolean }) {
  return <div className="flex justify-between"><span className="text-slate-500">{label}</span><span className={green ? 'text-green-600' : ''}>{inr(value)}</span></div>;
}
