import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  IndianRupee, ShoppingBag, Users, Store, TrendingUp,
  Eye, ChefHat, ClipboardList, AlertCircle, BarChart2,
  CheckCircle2, Clock, Flame
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Skeleton } from '@/components/ui/Skeleton';
import { inr } from '@/lib/cn';
import { stagger, fadeUp } from '@/lib/motion';

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-stone-100 text-stone-500',
};

const CHEF_STATUS_COLOR: Record<string, string> = {
  applied: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  pending_certificate: 'bg-purple-100 text-purple-700',
  certificate_uploaded: 'bg-indigo-100 text-indigo-700',
  active: 'bg-emerald-100 text-emerald-700',
  suspended: 'bg-red-100 text-red-600',
  rejected: 'bg-stone-100 text-stone-500',
};

function StatCard({ label, value, icon: Icon, money = false, sub, color = 'brand' }: any) {
  const colorMap: Record<string, string> = {
    brand: 'text-brand-500',
    green: 'text-emerald-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
  };
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -4 }} className="card p-4">
      <Icon className={`h-5 w-5 ${colorMap[color] || colorMap.brand}`} />
      <p className={`mt-2 text-xl font-extrabold ${colorMap[color]?.replace('text-', 'text-') || 'text-brand-700 dark:text-brand-400'}`}>
        {money && '₹'}<AnimatedNumber value={typeof value === 'number' ? value : 0} />
      </p>
      <p className="text-xs text-stone-400">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-stone-300">{sub}</p>}
    </motion.div>
  );
}

// Mini bar chart using SVG
function BarChart({ data, height = 60 }: { data: { date: string; views: number; unique?: number }[]; height?: number }) {
  if (!data?.length) return <div className="flex h-16 items-center justify-center text-xs text-stone-300">No data yet</div>;
  const max = Math.max(...data.map((d) => d.views), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d) => (
        <div key={d.date} className="group relative flex flex-1 flex-col items-center gap-0.5">
          <div
            className="w-full rounded-t bg-brand-400/70 transition-all group-hover:bg-brand-500"
            style={{ height: `${(d.views / max) * (height - 16)}px` }}
          />
          <span className="text-[9px] text-stone-300 rotate-45 origin-left translate-y-1 hidden md:block">
            {d.date.slice(5)}
          </span>
          {/* tooltip */}
          <div className="absolute bottom-full mb-1 hidden rounded bg-charcoal-900 px-2 py-1 text-[10px] text-white group-hover:block whitespace-nowrap z-10">
            {d.date}: {d.views} views{d.unique !== undefined ? `, ${d.unique} unique` : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Owner (Super Admin) dashboard ----
function OwnerDashboard() {
  const { data: overview, isLoading: ld1 } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: async () => (await api.get('/admin/analytics/overview')).data.data,
    refetchInterval: 60_000,
  });
  const { data: taskStats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => (await api.get('/admin/tasks/stats')).data.data,
    refetchInterval: 30_000,
  });
  const { data: recentTasks } = useQuery({
    queryKey: ['tasks-recent'],
    queryFn: async () => (await api.get('/admin/tasks?status=open')).data.data,
  });

  if (ld1) return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  );

  const v = overview;
  return (
    <div className="space-y-6">
      {/* Revenue */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          <IndianRupee className="h-4 w-4" /> Revenue
        </h2>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="All-time Revenue" value={v?.revenue?.allTime} icon={IndianRupee} money color="brand" />
          <StatCard label="All-time GMV" value={v?.revenue?.gmvAllTime} icon={ShoppingBag} money color="brand" />
          <StatCard label="Revenue (7 days)" value={v?.revenue?.last7d} icon={TrendingUp} money color="green" />
          <StatCard label="Revenue (30 days)" value={v?.revenue?.last30d} icon={TrendingUp} money color="green" />
        </motion.div>
      </section>

      {/* Orders */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          <ShoppingBag className="h-4 w-4" /> Orders
        </h2>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-3 gap-3">
          <StatCard label="Orders Today" value={v?.orders?.today} icon={Flame} color="amber" />
          <StatCard label="Orders (7 days)" value={v?.orders?.last7d} icon={ShoppingBag} color="brand" />
          <StatCard label="Orders (30 days)" value={v?.orders?.last30d} icon={ShoppingBag} color="brand" />
        </motion.div>
      </section>

      {/* Users & Chefs */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          <Users className="h-4 w-4" /> Users & Chefs
        </h2>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total Users" value={v?.users?.total} icon={Users} color="blue" />
          <StatCard label="New Today" value={v?.users?.newToday} icon={Users} color="green" sub={`+${v?.users?.new7d || 0} this week`} />
          <StatCard label="Active Chefs" value={v?.chefs?.active} icon={Store} color="brand" />
          <StatCard label="Pending Applications" value={v?.chefs?.pendingApplications} icon={ClipboardList} color="amber" />
        </motion.div>
      </section>

      {/* Visitors */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          <Eye className="h-4 w-4" /> Visitors
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <motion.div variants={stagger} initial="hidden" animate="show" className="col-span-1 grid grid-cols-1 gap-3">
            <StatCard label="Page Views Today" value={v?.visitors?.today} icon={Eye} color="purple" />
            <StatCard label="Views (7 days)" value={v?.visitors?.last7d} icon={BarChart2} color="purple" />
            <StatCard label="Unique Visitors (7d)" value={v?.visitors?.uniqueLast7d} icon={Users} color="blue" />
          </motion.div>
          <div className="card p-4 md:col-span-2">
            <p className="mb-3 text-sm font-semibold">Daily page views (last 7 days)</p>
            <BarChart data={v?.visitors?.dailyChart || []} height={80} />
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-stone-400">Top pages</p>
              <div className="space-y-1.5">
                {(v?.visitors?.topPages || []).slice(0, 6).map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between text-xs">
                    <span className="truncate font-mono text-stone-500">{p._id}</span>
                    <span className="ml-2 shrink-0 rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700 dark:bg-brand-900/20 dark:text-brand-300">
                      {p.views}
                    </span>
                  </div>
                ))}
                {!v?.visitors?.topPages?.length && <p className="text-stone-300">No page views tracked yet</p>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chef pipeline */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          <ChefHat className="h-4 w-4" /> Chef Onboarding Pipeline
        </h2>
        <div className="card p-4">
          <div className="flex flex-wrap gap-2">
            {v?.chefs?.pipeline && Object.entries(v.chefs.pipeline).map(([status, count]: any) => (
              <div key={status} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${CHEF_STATUS_COLOR[status] || 'bg-stone-100 text-stone-500'}`}>
                <span className="capitalize">{status.replace(/_/g, ' ')}</span>
                <span className="rounded-full bg-white/60 px-1.5 font-bold">{count}</span>
              </div>
            ))}
            {!v?.chefs?.pipeline && <p className="text-sm text-stone-300">No data</p>}
          </div>
        </div>
      </section>

      {/* Tasks snapshot */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-400">
          <ClipboardList className="h-4 w-4" /> Tasks Snapshot
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Open', value: taskStats?.open, icon: Clock, color: 'amber' },
            { label: 'In Progress', value: taskStats?.inProgress, icon: TrendingUp, color: 'blue' },
            { label: 'Done', value: taskStats?.done, icon: CheckCircle2, color: 'green' },
            { label: 'Overdue', value: taskStats?.overdue, icon: AlertCircle, color: 'red' },
          ].map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value || 0} icon={s.icon} color={s.color} />
          ))}
        </div>
        {recentTasks?.length > 0 && (
          <div className="card mt-3 p-4">
            <p className="mb-3 text-sm font-semibold">Open tasks</p>
            <div className="space-y-2">
              {recentTasks.slice(0, 5).map((t: any) => (
                <div key={t._id} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 dark:bg-white/5">
                  <div>
                    <p className="text-sm font-medium">{t.title}</p>
                    {t.assignedTo && <p className="text-xs text-stone-400">→ {t.assignedTo.name || t.assignedTo.phone}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                    {t.dueDate && new Date(t.dueDate) < new Date() && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">overdue</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ---- Ops manager dashboard ----
function OpsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: async () => (await api.get('/admin/revenue')).data.data,
  });
  const { data: taskStats } = useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => (await api.get('/admin/tasks/stats')).data.data,
  });

  if (isLoading) return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Platform Revenue" value={data?.platformRevenue} icon={IndianRupee} money />
        <StatCard label="Total Orders" value={data?.totalOrders} icon={ShoppingBag} />
        <StatCard label="Active Chefs" value={data?.activeChefs} icon={Store} />
        <StatCard label="Open Tasks" value={taskStats?.open} icon={Clock} color="amber" />
        <StatCard label="In Progress" value={taskStats?.inProgress} icon={TrendingUp} color="blue" />
        <StatCard label="Overdue" value={taskStats?.overdue} icon={AlertCircle} color="red" />
      </motion.div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const isOwner = user?.roles?.includes('platform_owner');

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {isOwner ? '⚡ Super Admin Dashboard' : 'Overview'}
          </h1>
          {isOwner && <p className="text-xs text-stone-400">Full platform visibility — real-time metrics</p>}
        </div>
        {isOwner && (
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            Super Admin
          </span>
        )}
      </div>
      {isOwner ? <OwnerDashboard /> : <OpsDashboard />}
    </div>
  );
}
