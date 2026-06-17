import { Link } from 'react-router-dom';

export function Logo({ className = 'h-10 w-auto', linked = true }: { className?: string; linked?: boolean }) {
  const img = <img src="/logo.png" alt="Maaswad — Home Food, Made with Mother's Love" className={className} />;
  return linked ? <Link to="/" aria-label="Maaswad home">{img}</Link> : img;
}
