import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-5xl font-extrabold text-brand-700">Maaswad</h1>
        <p className="mt-3 text-lg text-slate-600">Home Food, Made with Mother's Love</p>
        <p className="mt-6 max-w-2xl mx-auto text-slate-500">
          Authentic, hygienic, homemade Indian food from verified home chefs near you.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="btn-primary">Order Food</Link>
          <Link to="/become-chef" className="btn-outline">Become a Home Chef</Link>
        </div>
        <p className="mt-16 text-xs text-slate-400">Maaswad — Founded by Dr. Chef Vinoth</p>
      </div>
    </div>
  );
}
