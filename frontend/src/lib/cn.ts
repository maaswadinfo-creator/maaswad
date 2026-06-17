import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const inr = (n: number) => `₹${(n ?? 0).toLocaleString('en-IN')}`;
