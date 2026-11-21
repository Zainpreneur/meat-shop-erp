'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast-provider';
import {
  Badge,
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
import { categoriesApi, productsApi } from '@/lib/endpoints';
import { formatMoney, formatQty } from '@/lib/format';
import type { Category, Product, Unit } from '@/lib/types';

const UNITS: Unit[] = ['KG', 'GRAM', 'PIECE', 'DOZEN'];

interface ProductForm {
  name: string;
  sku: string;
  categoryId: string;
  unit: Unit;
  costPrice: string;
  sellingPrice: string;
  stockQty: string;
  reorderLevel: string;
}

const emptyForm: ProductForm = {
  name: '',
  sku: '',
  categoryId: '',
  unit: 'KG',
  costPrice: '',
  sellingPrice: '',
  stockQty: '',
  reorderLevel: '5',
};

export default function ProductsPage() {
  const { isManager } = useAuth();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock correction');
  const [adjustingBusy, setAdjustingBusy] = useState(false);

  const refresh = () => setReloadToken((token) => token + 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    productsApi
      .list({
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        lowStock: lowStockOnly || undefined,
      })
      .then((list) => {
        if (active) setProducts(list);
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
  }, [search, categoryFilter, lowStockOnly, reloadToken, notify]);

  useEffect(() => {
    let active = true;
    categoriesApi
      .list()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch((err) => {
        if (active) notify(apiErrorMessage(err), 'error');
      });
    return () => {
      active = false;
    };
  }, [reloadToken, notify]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId || '',
      unit: product.unit,
      costPrice: String(product.costPrice),
      sellingPrice: String(product.sellingPrice),
      stockQty: String(product.stockQty),
      reorderLevel: String(product.reorderLevel),
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
      const payload = {
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId || null,
        unit: form.unit,
        costPrice: Number(form.costPrice) || 0,
        sellingPrice: Number(form.sellingPrice) || 0,
        stockQty: Number(form.stockQty) || 0,
        reorderLevel: Number(form.reorderLevel) || 0,
      };
      if (editing) {
        await productsApi.update(editing.id, payload);
      } else {
        await productsApi.create(payload);
      }
      notify(editing ? 'Product updated' : 'Product created');
      closeModal();
      refresh();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string, name: string) {
    if (!window.confirm(`Deactivate ${name}?`)) return;
    try {
      await productsApi.remove(id);
      notify('Product deactivated');
      refresh();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    }
  }

  function openAdjust(product: Product) {
    setAdjusting(product);
    setAdjustQty('');
    setAdjustReason('Stock correction');
    setAdjustOpen(true);
  }

  function closeAdjust() {
    setAdjustOpen(false);
    setAdjusting(null);
  }

  async function submitAdjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!adjusting) return;
    const quantity = Number(adjustQty);
    if (!quantity) {
      notify('Enter a quantity (use a negative number to reduce stock)', 'error');
      return;
    }
    setAdjustingBusy(true);
    try {
      await productsApi.adjustStock(adjusting.id, quantity, adjustReason || 'Stock adjustment');
      notify('Stock adjusted');
      closeAdjust();
      refresh();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setAdjustingBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Products & Inventory"
        subtitle="Manage your cuts, prices, and stock levels"
        actions={
          isManager ? (
            <Button leftIcon="plus" onClick={openCreate}>
              Add Product
            </Button>
          ) : null
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="product-search">Search</Label>
            <Input
              id="product-search"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="min-w-[180px]">
            <Label htmlFor="product-category">Category</Label>
            <Select
              id="product-category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(event) => setLowStockOnly(event.target.checked)}
              className="h-4 w-4 rounded border-line accent-brand-600"
            />
            Low stock only
          </label>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingRow />
        ) : products.length === 0 ? (
          <EmptyState message="No products found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Cost</th>
                  <th className="pb-2 text-right">Price</th>
                  <th className="pb-2 text-right">Stock</th>
                  <th className="pb-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const low = product.stockQty <= product.reorderLevel;
                  return (
                    <tr key={product.id}>
                      <td className="py-2.5">
                        <div className="font-medium text-ink">{product.name}</div>
                        <div className="text-xs text-slate-400">{product.sku}</div>
                      </td>
                      <td className="py-2.5 text-slate-500">{product.category?.name || '—'}</td>
                      <td className="py-2.5 text-right text-slate-500">{formatMoney(product.costPrice)}</td>
                      <td className="py-2.5 text-right font-medium text-slate-700">{formatMoney(product.sellingPrice)}</td>
                      <td className="py-2.5 text-right">
                        <Badge tone={low ? (product.stockQty <= 0 ? 'danger' : 'warning') : 'success'}>
                          {formatQty(product.stockQty, product.unit)}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        {isManager ? (
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                              onClick={() => openEdit(product)}
                            >
                              <Icon name="edit" size={13} /> Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                              onClick={() => openAdjust(product)}
                            >
                              <Icon name="refresh" size={13} /> Adjust
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:underline"
                              onClick={() => void deactivate(product.id, product.name)}
                            >
                              <Icon name="trash" size={13} /> Deactivate
                            </button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="form-name">Name</Label>
              <Input
                id="form-name"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="form-sku">SKU</Label>
              <Input
                id="form-sku"
                required
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="form-unit">Unit</Label>
              <Select
                id="form-unit"
                value={form.unit}
                onChange={(event) => setForm({ ...form, unit: event.target.value as Unit })}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="form-category">Category</Label>
              <Select
                id="form-category"
                value={form.categoryId}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
              >
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="form-cost">Cost Price</Label>
              <Input
                id="form-cost"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.costPrice}
                onChange={(event) => setForm({ ...form, costPrice: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="form-price">Selling Price</Label>
              <Input
                id="form-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.sellingPrice}
                onChange={(event) => setForm({ ...form, sellingPrice: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="form-stock">Stock Quantity</Label>
              <Input
                id="form-stock"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.stockQty}
                onChange={(event) => setForm({ ...form, stockQty: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="form-reorder">Reorder Level</Label>
              <Input
                id="form-reorder"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.reorderLevel}
                onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? 'Saving…' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={adjustOpen} onClose={closeAdjust} title={`Adjust Stock — ${adjusting?.name ?? ''}`}>
        <form onSubmit={submitAdjust} className="space-y-4">
          <p className="text-sm text-slate-500">
            Current stock: <span className="font-medium text-ink">{adjusting ? formatQty(adjusting.stockQty, adjusting.unit) : '—'}</span>
          </p>
          <div>
            <Label htmlFor="adjust-qty">Quantity change</Label>
            <Input
              id="adjust-qty"
              type="number"
              step="0.01"
              required
              placeholder="e.g. 5 or -2"
              value={adjustQty}
              onChange={(event) => setAdjustQty(event.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400">Use a negative number to remove stock.</p>
          </div>
          <div>
            <Label htmlFor="adjust-reason">Reason</Label>
            <Input
              id="adjust-reason"
              required
              value={adjustReason}
              onChange={(event) => setAdjustReason(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeAdjust}>
              Cancel
            </Button>
            <Button type="submit" loading={adjustingBusy}>
              {adjustingBusy ? 'Saving…' : 'Adjust Stock'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
