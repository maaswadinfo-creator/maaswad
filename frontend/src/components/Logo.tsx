import { Link } from 'react-router-dom';

export function Logo({ iconClassName = 'h-11 w-11', wordmark = true, linked = true }: {
  iconClassName?: string; wordmark?: boolean; linked?: boolean;
}) {
  const content = (
    <span className="flex items-center gap-2.5">
      <img src="/logo-icon.png" alt="Maaswad" className={`${iconClassName} rounded-full shadow-soft ring-1 ring-black/5`} />
      {wordmark && (
        <span className="leading-none">
          <span className="block font-display text-2xl font-extrabold tracking-tight text-burgundy-700 dark:text-stone-100">Maaswad</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.15em] text-brand-600">Home Food</span>
        </span>
      )}
    </span>
  );
  return linked ? <Link to="/" aria-label="Maaswad home">{content}</Link> : content;
}
