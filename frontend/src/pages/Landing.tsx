import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <img src="/logo.png" alt="Maaswad — Home Food, Made with Mother's Love" className="mx-auto h-44 w-auto" />
        <p className="mt-2 text-lg text-slate-600">Home Food, Made with Mother's Love</p>
        <p className="mt-6 max-w-2xl mx-auto text-slate-500">
          Authentic, hygienic, homemade Indian food from verified home chefs near you —
          empowering local home cooks and preserving traditional recipes.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="btn-primary">Order Food</Link>
          <Link to="/become-chef" className="btn-outline">Become a Home Chef</Link>
        </div>
      </div>

      {/* Founder section */}
      <div className="mx-auto max-w-3xl px-6 pb-16">
        <div className="card flex flex-col items-center gap-5 p-7 text-center sm:flex-row sm:text-left">
          <img src="/founder.jpg" alt="Dr. Chef Vinoth Kumar" className="h-28 w-28 flex-shrink-0 rounded-full object-cover ring-4 ring-brand-100" />
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">An initiative by</div>
            <h2 className="text-xl font-bold text-slate-800">Dr. Chef Vinoth Kumar</h2>
            <p className="mt-2 text-sm text-slate-500">
              Maaswad is the vision of Dr. Chef Vinoth Kumar — a mission to connect verified home
              chefs with food lovers, enable local entrepreneurship, and preserve the authentic
              taste of traditional Indian home cooking, made with a mother's love.
            </p>
          </div>
        </div>
      </div>

      <p className="pb-10 text-center text-xs text-slate-400">Maaswad — An initiative by Dr. Chef Vinoth Kumar</p>
    </div>
  );
}
