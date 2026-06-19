import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ShieldAlert, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageLoader } from '@/components/ui/Spinner';

export default function AdminUsers() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'operations_manager' | 'platform_owner'>('operations_manager');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get('/admin/admin-users')).data.data,
  });

  const add = useMutation({
    mutationFn: () => api.post('/admin/admin-users', { phone, role }),
    onSuccess: () => {
      toast.success('Admin user added');
      setPhone('');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/admin-users/${id}`),
    onSuccess: () => { toast.success('Admin role removed'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Admin Users</h1>
      <p className="text-sm text-stone-500">
        Manage who has admin (Operations Manager) or owner (Super Admin) access. Users log in with their phone number via OTP.
      </p>

      {/* Add admin */}
      <div className="card p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-brand-600" />Add Admin by Phone Number</h2>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="input flex-1"
            placeholder="Phone number (e.g. +919876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <select
            className="input sm:w-48"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="operations_manager">Operations Manager</option>
            <option value="platform_owner">Super Admin (Owner)</option>
          </select>
          <Button loading={add.isPending} onClick={() => phone ? add.mutate() : toast.error('Enter a phone number')}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <p className="text-xs text-stone-400">
          If the phone number is new, a placeholder account will be created. The user will complete login via OTP when they first log in.
        </p>
      </div>

      {/* User list */}
      <div className="card p-4">
        <h2 className="mb-3 font-semibold">Current Admin Users ({users?.length || 0})</h2>
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {users?.map((u: any) => (
            <div key={u._id} className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{u.name || u.phone || u.email}</p>
                  {u.roles.includes('platform_owner') ? (
                    <span className="badge bg-red-100 text-red-700 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> Super Admin
                    </span>
                  ) : (
                    <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Ops Manager
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400">
                  {[u.phone, u.email].filter(Boolean).join(' · ')}
                  {u.createdAt && ` · Added ${new Date(u.createdAt).toLocaleDateString('en-IN')}`}
                </p>
              </div>
              <button
                onClick={() => remove.mutate(u._id)}
                disabled={remove.isPending}
                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {!users?.length && (
            <p className="py-4 text-center text-sm text-stone-400">No admin users found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
