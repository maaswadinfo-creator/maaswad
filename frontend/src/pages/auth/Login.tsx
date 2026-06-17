import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { firebaseConfigured, getFirebaseAuth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

export default function Login() {
  const { requestOtp, verifyOtp, firebaseLogin } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [channel, setChannel] = useState<'phone' | 'email'>('phone');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  // Phone OTP goes through Firebase when configured; otherwise dev OTP endpoint.
  const usePhoneFirebase = channel === 'phone' && firebaseConfigured;

  useEffect(() => {
    if (!usePhoneFirebase) return;
    if (!recaptchaRef.current) {
      try {
        recaptchaRef.current = new RecaptchaVerifier(getFirebaseAuth(), 'recaptcha-container', { size: 'invisible' });
      } catch { /* ignore double-init */ }
    }
  }, [usePhoneFirebase]);

  const payload = () => channel === 'phone' ? { channel, phone: value } : { channel, email: value } as const;

  const onRequest = async () => {
    if (!value) return toast.error('Enter your ' + channel);
    setLoading(true);
    try {
      if (usePhoneFirebase) {
        const phone = value.startsWith('+') ? value : `+91${value}`;
        confirmRef.current = await signInWithPhoneNumber(getFirebaseAuth(), phone, recaptchaRef.current!);
        toast.success('OTP sent via SMS');
      } else {
        const res = await requestOtp(payload() as any);
        toast.success(res.devOtp ? `OTP (dev): ${res.devOtp}` : 'OTP sent');
      }
      setStep('verify');
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };

  const onVerify = async () => {
    setLoading(true);
    try {
      if (usePhoneFirebase) {
        if (!confirmRef.current) throw new Error('Request OTP first');
        const cred = await confirmRef.current.confirm(code);
        const idToken = await cred.user.getIdToken();
        await firebaseLogin(idToken);
      } else {
        await verifyOtp({ ...(payload() as any), code });
      }
      toast.success('Welcome to Maaswad!');
      nav(loc.state?.from || '/', { replace: true });
    } catch (e) { toast.error(getErrorMessage(e)); } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-2xl font-extrabold text-brand-700">Maaswad</h1>
        <p className="mb-5 text-sm text-slate-500">Login or sign up to continue</p>

        <div className="mb-4 flex rounded-xl bg-slate-100 p-1 text-sm">
          {(['phone', 'email'] as const).map((c) => (
            <button key={c} onClick={() => { setChannel(c); setStep('request'); }}
              className={`flex-1 rounded-lg py-1.5 capitalize ${channel === c ? 'bg-white shadow font-semibold text-brand-700' : 'text-slate-500'}`}>{c}</button>
          ))}
        </div>

        {step === 'request' ? (
          <>
            <input className="input" placeholder={channel === 'phone' ? '+91XXXXXXXXXX' : 'you@email.com'} value={value} onChange={(e) => setValue(e.target.value)} />
            <Button className="mt-4 w-full" loading={loading} onClick={onRequest}>Send OTP</Button>
          </>
        ) : (
          <>
            <input className="input tracking-[0.5em] text-center text-lg" placeholder="••••••" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
            <Button className="mt-4 w-full" loading={loading} onClick={onVerify}>Verify & Continue</Button>
            <button className="mt-3 w-full text-xs text-slate-400" onClick={() => setStep('request')}>Change {channel}</button>
          </>
        )}

        <div id="recaptcha-container" />
        <p className="mt-6 text-center text-xs text-slate-400">Founded by Dr. Chef Vinoth</p>
      </div>
    </div>
  );
}
