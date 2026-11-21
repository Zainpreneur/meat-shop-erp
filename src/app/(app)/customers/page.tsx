'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast-provider';
import { Badge, Button, Card, EmptyState, Input, Label, LoadingRow, Modal, PageHeader } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';
import { customersApi } from '@/lib/endpoints';
import { formatMoney } from '@/lib/format';
import type { Customer } from '@/lib/types';

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function CustomersPage() {
  const { notify } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    customersApi
      .list()
      .then((list) => {
        if (active) setCustomers(list);
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

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
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
        await customersApi.update(editing.id, form);
      } else {
        await customersApi.create(form);
      }
      notify(editing ? 'Customer updated' : 'Customer added');
      closeModal();
      const refreshed = await customersApi.list();
      setCustomers(refreshed);
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeCustomer(customer: Customer) {
    if (!window.confirm(`Delete ${customer.name}?`)) return;
    setDeletingId(customer.id);
    try {
      await customersApi.remove(customer.id);
      notify('Customer removed');
      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const query = search.trim().toLowerCase();
  const visibleCustomers = customers.filter((customer) =>
    [customer.name, customer.phone, customer.email]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Regulars, credit accounts, and contact info"
        actions={
          <Button leftIcon="plus" onClick={openCreate}>
            Add Customer
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="max-w-sm">
          <Label htmlFor="customer-search">Search</Label>
          <Input
            id="customer-search"
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingRow />
        ) : visibleCustomers.length === 0 ? (
          <EmptyState message="No customers yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Phone</th>
                  <th className="pb-2">Orders</th>
                  <th className="pb-2">Credit Balance</th>
                  <th className="pb-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="py-2.5 font-medium text-ink">{customer.name}</td>
                    <td className="py-2.5 text-slate-500">{customer.phone || '—'}</td>
                    <td className="py-2.5 text-slate-500">{customer._count?.sales ?? 0}</td>
                    <td className="py-2.5">
                      {customer.creditBalance > 0 ? (
                        <Badge tone="warning">{formatMoney(customer.creditBalance)}</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          onClick={() => openEdit(customer)}
                        >
                          <Icon name="edit" size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === customer.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
                          onClick={() => void removeCustomer(customer)}
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="customer-name">Name</Label>
            <Input
              id="customer-name"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="customer-address">Address</Label>
            <Input
              id="customer-address"
              value={form.address}
              onChange={(event) => setForm({ ...form, address: event.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
