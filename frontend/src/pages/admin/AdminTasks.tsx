import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, CheckCircle2, Clock, AlertCircle, Trash2, ChevronDown,
  ChevronUp, MessageSquare, UserCheck, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high:   'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low:    'bg-stone-100 text-stone-500 border-stone-200',
};

const STATUS_COLOR: Record<string, string> = {
  open:        'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done:        'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-stone-100 text-stone-400',
};

const CATEGORIES = ['chef_review', 'order_issue', 'customer_support', 'content', 'finance', 'operations', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

function TaskCard({ task, isOwner, admins, qc }: { task: any; isOwner: boolean; admins: any[]; qc: any }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');

  const update = useMutation({
    mutationFn: (body: any) => api.patch(`/admin/tasks/${task._id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-tasks'] }); qc.invalidateQueries({ queryKey: ['task-stats'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const del = useMutation({
    mutationFn: () => api.delete(`/admin/tasks/${task._id}`),
    onSuccess: () => { toast.success('Task deleted'); qc.invalidateQueries({ queryKey: ['admin-tasks'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const submitNote = () => {
    if (!note.trim()) return;
    update.mutate({ note });
    setNote('');
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className={`card border-l-4 p-4 ${PRIORITY_COLOR[task.priority]?.split(' ')[2] || 'border-stone-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLOR[task.priority]}`}>{task.priority}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[task.status]}`}>{task.status.replace('_', ' ')}</span>
            <span className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs text-stone-500 dark:border-white/10">{task.category?.replace('_', ' ')}</span>
            {isOverdue && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">⚠ Overdue</span>}
          </div>
          <p className="font-semibold">{task.title}</p>
          {task.description && <p className="mt-1 text-sm text-stone-500">{task.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-400">
            {task.assignedTo && (
              <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" />{task.assignedTo.name || task.assignedTo.phone}</span>
            )}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                <Calendar className="h-3.5 w-3.5" />Due {new Date(task.dueDate).toLocaleDateString('en-IN')}
              </span>
            )}
            <span>by {task.createdBy?.name || 'Admin'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded((s) => !s)} className="rounded-lg border p-1.5 text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {isOwner && (
            <button onClick={() => del.mutate()} className="rounded-lg p-1.5 text-red-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-black/5 pt-4 dark:border-white/5">
          {/* Status buttons */}
          <div>
            <p className="mb-2 text-xs font-semibold text-stone-400 uppercase tracking-wide">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {(['open', 'in_progress', 'done', 'cancelled'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update.mutate({ status: s })}
                  disabled={task.status === s || update.isPending}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${task.status === s ? STATUS_COLOR[s] + ' opacity-100' : 'border-black/10 bg-white text-stone-500 hover:border-brand-300 dark:border-white/10 dark:bg-charcoal-900'}`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Reassign (owner only) */}
          {isOwner && admins.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-stone-400 uppercase tracking-wide">Assign To</p>
              <select
                className="input text-sm"
                defaultValue={task.assignedTo?._id || ''}
                onChange={(e) => update.mutate({ assignedTo: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {admins.map((u: any) => (
                  <option key={u._id} value={u._id}>{u.name || u.phone} ({u.roles.includes('platform_owner') ? 'Super Admin' : 'Ops'})</option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <p className="mb-2 text-xs font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> Notes ({task.notes?.length || 0})
            </p>
            <div className="mb-3 space-y-2">
              {task.notes?.map((n: any, i: number) => (
                <div key={i} className="rounded-lg bg-stone-50 px-3 py-2 text-sm dark:bg-white/5">
                  <p className="text-stone-700 dark:text-stone-300">{n.body}</p>
                  <p className="mt-1 text-xs text-stone-400">{n.by?.name || 'Admin'} · {new Date(n.at).toLocaleString('en-IN')}</p>
                </div>
              ))}
              {!task.notes?.length && <p className="text-xs text-stone-300">No notes yet</p>}
            </div>
            <div className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitNote()} />
              <Button onClick={submitNote} loading={update.isPending}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTasks() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const isOwner = user?.roles?.includes('platform_owner');

  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', category: 'operations',
    assignedTo: '', dueDate: '',
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['admin-tasks', statusFilter],
    queryFn: async () => (await api.get(`/admin/tasks${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`)).data.data,
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/admin-users')).data.data,
    enabled: isOwner,
  });

  const create = useMutation({
    mutationFn: () => api.post('/admin/tasks', {
      ...form,
      assignedTo: form.assignedTo || undefined,
      dueDate: form.dueDate || undefined,
    }),
    onSuccess: () => {
      toast.success('Task created');
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'medium', category: 'operations', assignedTo: '', dueDate: '' });
      qc.invalidateQueries({ queryKey: ['admin-tasks'] });
      qc.invalidateQueries({ queryKey: ['task-stats'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const counts = tasks?.reduce((acc: any, t: any) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {}) || {};

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tasks</h1>
          <p className="text-xs text-stone-400">{isOwner ? 'Create and assign tasks to the ops team' : 'Your assigned tasks'}</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowCreate((s) => !s)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Task
          </Button>
        )}
      </div>

      {/* Create task form */}
      {showCreate && isOwner && (
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold">Create Task</h2>
          <input className="input" placeholder="Task title *" value={form.title} onChange={(e) => set('title', e.target.value)} />
          <textarea className="input min-h-[72px] resize-none text-sm" placeholder="Description (optional)" value={form.description} onChange={(e) => set('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-stone-400">Priority</label>
              <select className="input text-sm" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-400">Category</label>
              <select className="input text-sm" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-400">Assign to</label>
              <select className="input text-sm" value={form.assignedTo} onChange={(e) => set('assignedTo', e.target.value)}>
                <option value="">Unassigned</option>
                {admins.map((u: any) => (
                  <option key={u._id} value={u._id}>{u.name || u.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-stone-400">Due date</label>
              <input className="input text-sm" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button loading={create.isPending} onClick={() => form.title ? create.mutate() : toast.error('Title is required')}>
              Create Task
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 text-sm">
        {[
          { val: 'all', label: `All (${tasks?.length || 0})` },
          { val: 'open', label: `Open (${counts.open || 0})` },
          { val: 'in_progress', label: `In Progress (${counts.in_progress || 0})` },
          { val: 'done', label: `Done (${counts.done || 0})` },
        ].map((t) => (
          <button
            key={t.val}
            onClick={() => setStatusFilter(t.val)}
            className={`rounded-full border px-3 py-1.5 font-medium transition ${statusFilter === t.val ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-black/10 bg-white text-stone-500 dark:border-white/10 dark:bg-charcoal-900'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {tasks?.map((t: any) => (
          <TaskCard key={t._id} task={t} isOwner={!!isOwner} admins={admins} qc={qc} />
        ))}
        {!tasks?.length && (
          <div className="card flex flex-col items-center gap-2 p-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-stone-200" />
            <p className="text-stone-400">No tasks {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}</p>
            {isOwner && <p className="text-sm text-stone-300">Create one to assign work to your ops team</p>}
          </div>
        )}
      </div>
    </div>
  );
}
