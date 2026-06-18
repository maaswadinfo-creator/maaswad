import { ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'outline' | 'ghost';
interface Props extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...rest }: Props) {
  const v = variant === 'primary' ? 'btn-primary' : variant === 'outline' ? 'btn-outline' : 'btn-ghost';
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(v, className)}
      disabled={disabled || loading}
      {...(rest as HTMLMotionProps<'button'>)}
    >
      {loading && <Spinner className="h-4 w-4 border-white/40 border-t-white" />}
      {children as any}
    </motion.button>
  );
}
