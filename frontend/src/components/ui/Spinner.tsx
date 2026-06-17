export function Spinner({ className = '' }: { className?: string }) {
  return <div className={`animate-spin rounded-full border-2 border-brand-200 border-t-brand-600 h-5 w-5 ${className}`} />;
}
export function PageLoader() {
  return <div className="flex h-[60vh] items-center justify-center"><Spinner className="h-8 w-8" /></div>;
}
