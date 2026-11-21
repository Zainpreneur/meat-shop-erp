'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import { Badge, Button, Card, EmptyState, Input, Label, LoadingRow, Modal, PageHeader, Select } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';
import { usersApi } from '@/lib/endpoints';
import { formatDate } from '@/lib/format';
import type { Role, User } from '@/lib/types';

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'CASHIER'];

const emptyForm = { name: '', email: '', password: '', role: 'CASHIER' as Role };

export default function UsersPage() {
  const { user: me, loading: authLoading, isAdmin } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/');
  }, [authLoading, isAdmin, router]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    let active = true;
    usersApi
      .list()
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch((err) => {
        if (active) notify(apiErrorMessage(err), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, isAdmin, notify]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await usersApi.create(form);
      notify('User created');
      setModalOpen(false);
      setForm(emptyForm);
      const refreshed = await usersApi.list();
      setUsers(refreshed);
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: User) {
    setBusyId(user.id);
    try {
      await usersApi.update(user.id, { active: !user.active });
      notify('User updated');
      const refreshed = await usersApi.list();
      setUsers(refreshed);
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Users & Staff"
        subtitle="Manage who can access the system"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            Add User
          </Button>
        }
      />

      <Card>
        {loading ? (
          <LoadingRow />
        ) : users.length === 0 ? (
          <EmptyState message="No users yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2">Joined</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="py-2.5 font-medium text-ink">{user.name}</td>
                    <td className="py-2.5 text-slate-500">{user.email}</td>
                    <td className="py-2.5">
                      <Badge tone="info">{user.role}</Badge>
                    </td>
                    <td className="py-2.5 text-slate-500">{user.createdAt ? formatDate(user.createdAt) : '—'}</td>
                    <td className="py-2.5">
                      <Badge tone={user.active ? 'success' : 'default'}>{user.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="py-2.5 text-right">
                      {user.id !== me?.id ? (
                        <button
                          type="button"
                          disabled={busyId === user.id}
                          className="text-xs font-medium text-brand-600 hover:underline disabled:opacity-50"
                          onClick={() => void toggleActive(user)}
                        >
                          {user.active ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add User">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="user-role">Role</Label>
            <Select
              id="user-role"
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
