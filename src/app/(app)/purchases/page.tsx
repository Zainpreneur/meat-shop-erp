'use client';

import { useEffect, useState } from 'react';
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
  Textarea,
} from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';
import { productsApi, purchasesApi, suppliersApi } from '@/lib/endpoints';
import { formatDate, formatMoney, formatQty } from '@/lib/format';
import type { Product, Purchase, PurchaseStatus, Supplier } from '@/lib/types';

const statusTone: Record<PurchaseStatus, 'success' | 'warning' | 'default'> = {
  PENDING: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'default',
};

interface DraftItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export default function PurchasesPage() {
  const { notify } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => setReloadToken((token) => token + 1);

  useEffect(() => {
    let active = true;
    setLoading(true);
    purchasesApi
      .list()
      .then((list) => {
        if (active) setPurchases(list);
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
  }, [reloadToken, notify]);

  useEffect(() => {
    let active = true;
    Promise.all([suppliersApi.list(), productsApi.list()])
      .then(([supplierList, productList]) => {
        if (active) {
          setSuppliers(supplierList);
          setProducts(productList);
        }
      })
      .catch((err) => {
        if (active) notify(apiErrorMessage(err), 'error');
      });
    return () => {
      active = false;
    };
  }, [reloadToken, notify]);

  function openModal() {
    setSupplierId('');
    setNotes('');
    setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function productDefaultCost(id: string): number {
    return products.find((product) => product.id === id)?.costPrice || 0;
  }

  async function createPurchase() {
    setSaving(true);
    try {
      await purchasesApi.create({
        supplierId,
        notes: notes || undefined,
        items: items.filter((item) => item.productId && item.quantity > 0),
      });
      notify('Purchase order created');
      closeModal();
      refresh();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function receivePurchase(id: string) {
    setBusyId(id);
    try {
      await purchasesApi.receive(id);
      notify('Stock received');
      refresh();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function cancelPurchase(id: string) {
    if (!window.confirm('Cancel this purchase order?')) return;
    setBusyId(id);
    try {
      await purchasesApi.cancel(id);
      notify('Purchase order cancelled');
      refresh();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  const visiblePurchases = statusFilter ? purchases.filter((po) => po.status === statusFilter) : purchases;
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  return (
    <>
      <PageHeader
        title="Purchases"
        subtitle="Purchase orders and stock intake"
        actions={
          <Button leftIcon="plus" onClick={openModal}>
            New Purchase Order
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="max-w-xs">
          <Label htmlFor="purchase-status">Filter by status</Label>
          <Select id="purchase-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingRow />
        ) : visiblePurchases.length === 0 ? (
          <EmptyState message="No purchase orders yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Supplier</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePurchases.map((po) => (
                  <tr key={po.id}>
                    <td className="py-2.5 font-medium text-slate-700">{po.reference}</td>
                    <td className="py-2.5 text-slate-500">{po.supplier?.name}</td>
                    <td className="py-2.5 text-slate-500">{formatDate(po.orderDate)}</td>
                    <td className="py-2.5">
                      <Badge tone={statusTone[po.status]}>{po.status}</Badge>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-ink">{formatMoney(po.totalAmount)}</td>
                    <td className="py-2.5 text-right">
                      {po.status === 'PENDING' ? (
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            disabled={busyId === po.id}
                            className="text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50"
                            onClick={() => void receivePurchase(po.id)}
                          >
                            Receive
                          </button>
                          <button
                            type="button"
                            disabled={busyId === po.id}
                            className="text-xs font-medium text-red-500 hover:underline disabled:opacity-50"
                            onClick={() => void cancelPurchase(po.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={closeModal} title="New Purchase Order" width="max-w-2xl">
        <div className="space-y-4">
          <div>
            <Label htmlFor="po-supplier">Supplier</Label>
            <Select id="po-supplier" value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">Select a supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-5">
                  <Select
                    aria-label={`Product for line ${index + 1}`}
                    value={item.productId}
                    onChange={(event) =>
                      updateItem(index, { productId: event.target.value, unitCost: productDefaultCost(event.target.value) })
                    }
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({formatQty(product.stockQty, product.unit)} in stock)
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Qty"
                    aria-label={`Quantity for line ${index + 1}`}
                    value={item.quantity}
                    onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Unit cost"
                    aria-label={`Unit cost for line ${index + 1}`}
                    value={item.unitCost}
                    onChange={(event) => updateItem(index, { unitCost: Number(event.target.value) })}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remove line ${index + 1}`}
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                  className="col-span-1 text-slate-300 hover:text-red-500"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
              onClick={() => setItems((prev) => [...prev, { productId: '', quantity: 1, unitCost: 0 }])}
            >
              <Icon name="plus" size={13} /> Add line item
            </button>
          </div>

          <div>
            <Label htmlFor="po-notes">Notes (optional)</Label>
            <Textarea
              id="po-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Delivery notes, expected date, etc."
            />
          </div>

          <div className="flex justify-between border-t border-line pt-3 text-base font-bold text-ink">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              disabled={!supplierId || items.every((item) => !item.productId)}
              loading={saving}
              onClick={() => void createPurchase()}
            >
              {saving ? 'Creating…' : 'Create Purchase Order'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
