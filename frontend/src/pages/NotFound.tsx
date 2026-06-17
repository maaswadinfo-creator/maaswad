import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl font-extrabold text-brand-300">404</div>
      <p className="text-slate-500">This page could not be found.</p>
      <Link to="/" className="btn-primary">Go home</Link>
    </div>
  );
}
