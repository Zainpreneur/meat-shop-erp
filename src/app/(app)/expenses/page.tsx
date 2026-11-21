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
  Select,
} from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';
import { expensesApi } from '@/lib/endpoints';
import { formatDate, formatMoney } from '@/lib/format';
import type { Expense } from '@/lib/types';

const EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Wages', 'Equipment', 'Transport', 'Packaging', 'Maintenance', 'Other'];

interface ExpenseForm {
  category: string;
  description: string;
  amount: string;
  expenseDate: string;
}

const emptyForm: ExpenseForm = {
  category: EXPENSE_CATEGORIES[0],
  description: '',
  amount: '',
  expenseDate: '',
};

export default function ExpensesPage() {
  const { notify } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setForm((current) => ({ ...current, expenseDate: new Date().toISOString().slice(0, 10) }));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    expensesApi
      .list({ category: categoryFilter || undefined })
      .then((list) => {
        if (active) setExpenses(list);
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
  }, [categoryFilter, notify]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, expenseDate: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setForm({
      category: expense.category,
      description: expense.description,
      amount: String(expense.amount),
      expenseDate: expense.expenseDate.slice(0, 10),
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
      const payload = { ...form, amount: Number(form.amount) || 0 };
      if (editing) {
        await expensesApi.update(editing.id, payload);
      } else {
        await expensesApi.create(payload);
      }
      notify(editing ? 'Expense updated' : 'Expense recorded');
      closeModal();
      const refreshed = await expensesApi.list({ category: categoryFilter || undefined });
      setExpenses(refreshed);
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function removeExpense(expense: Expense) {
    if (!window.confirm('Delete this expense?')) return;
    setDeletingId(expense.id);
    try {
      await expensesApi.remove(expense.id);
      notify('Expense deleted');
      setExpenses((prev) => prev.filter((item) => item.id !== expense.id));
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const query = search.trim().toLowerCase();
  const visibleExpenses = expenses.filter(
    (expense) => !query || expense.description.toLowerCase().includes(query) || expense.category.toLowerCase().includes(query)
  );
  const total = visibleExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`Total recorded: ${formatMoney(total)}`}
        actions={
          <Button leftIcon="plus" onClick={openCreate}>
            Add Expense
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="expense-search">Search</Label>
            <Input
              id="expense-search"
              placeholder="Search by description or category..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="min-w-[180px]">
            <Label htmlFor="expense-category">Category</Label>
            <Select
              id="expense-category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingRow />
        ) : visibleExpenses.length === 0 ? (
          <EmptyState message="No expenses recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Recorded By</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="py-2.5 text-slate-500">{formatDate(expense.expenseDate)}</td>
                    <td className="py-2.5 text-slate-700">{expense.category}</td>
                    <td className="py-2.5 text-slate-500">{expense.description}</td>
                    <td className="py-2.5 text-slate-500">{expense.user?.name}</td>
                    <td className="py-2.5 text-right font-medium text-ink">{formatMoney(expense.amount)}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                          onClick={() => openEdit(expense)}
                        >
                          <Icon name="edit" size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === expense.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
                          onClick={() => void removeExpense(expense)}
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="expense-form-category">Category</Label>
            <Select
              id="expense-form-category"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="expense-form-description">Description</Label>
            <Input
              id="expense-form-description"
              required
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expense-form-amount">Amount</Label>
              <Input
                id="expense-form-amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense-form-date">Date</Label>
              <Input
                id="expense-form-date"
                type="date"
                required
                value={form.expenseDate}
                onChange={(event) => setForm({ ...form, expenseDate: event.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : editing ? 'Update Expense' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
