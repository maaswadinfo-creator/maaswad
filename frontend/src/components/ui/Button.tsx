import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  loading?: boolean;
}
export function Button({ variant = 'primary', loading, className, children, disabled, ...rest }: Props) {
  const v = variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : 'btn-ghost';
  return (
    <button className={cn(v, className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="h-4 w-4 border-white/40 border-t-white" />}
      {children}
    </button>
  );
}
