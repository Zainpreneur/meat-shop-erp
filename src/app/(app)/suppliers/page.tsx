'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast-provider';
import {
  Button,
  Card,
  EmptyState,
  Input,
  Label,
  LoadingRow,
  Modal,
  PageHeader,
  Textarea,
} from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';
import { suppliersApi } from '@/lib/endpoints';
import type { Supplier } from '@/lib/types';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

export default function SuppliersPage() {
  const { notify } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    suppliersApi
      .list()
      .then((list) => {
        if (active) setSuppliers(list);
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
  }, [notify]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await suppliersApi.update(editing.id, form);
      } else {
        await suppliersApi.create(form);
      }
      notify(editing ? 'Supplier updated' : 'Supplier created');
      closeModal();
      const refreshed = await suppliersApi.list();
      setSuppliers(refreshed);
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeSupplier(supplier: Supplier) {
    if (!window.confirm(`Delete ${supplier.name}?`)) return;
    setDeletingId(supplier.id);
    try {
      await suppliersApi.remove(supplier.id);
      notify('Supplier removed');
      setSuppliers((prev) => prev.filter((item) => item.id !== supplier.id));
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const query = search.trim().toLowerCase();
  const visibleSuppliers = suppliers.filter((supplier) =>
    [supplier.name, supplier.phone, supplier.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle="Vendors you buy meat and supplies from"
        actions={
          <Button leftIcon="plus" onClick={openCreate}>
            Add Supplier
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="max-w-sm">
          <Label htmlFor="supplier-search">Search</Label>
          <Input
            id="supplier-search"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingRow />
        ) : visibleSuppliers.length === 0 ? (
          <EmptyState message="No suppliers yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Purchases</th>
                  <th className="pb-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSuppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="py-2.5 font-medium text-ink">{supplier.name}</td>
                    <td className="py-2.5 text-slate-500">{supplier.phone || '—'}</td>
                    <td className="py-2.5 text-slate-500">{supplier.email || '—'}</td>
                    <td className="py-2.5 text-slate-500">{supplier._count?.purchases ?? 0}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          onClick={() => openEdit(supplier)}
                        >
                          <Icon name="edit" size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === supplier.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
                          onClick={() => void removeSupplier(supplier)}
                        >
                          <Icon name="trash" size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="supplier-name">Name</Label>
            <Input
              id="supplier-name"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="supplier-phone">Phone</Label>
              <Input
                id="supplier-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="supplier-address">Address</Label>
            <Input
              id="supplier-address"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="supplier-notes">Notes</Label>
            <Textarea
              id="supplier-notes"
              rows={2}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
