'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import { Badge, Button, Card, EmptyState, Input, Label, LoadingRow, Modal, PageHeader } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';
import { salesApi } from '@/lib/endpoints';
import { formatDateTime, formatMoney, formatQty } from '@/lib/format';
import type { Sale, SaleStatus } from '@/lib/types';

const statusTone: Record<SaleStatus, 'success' | 'danger' | 'default'> = {
  COMPLETED: 'success',
  REFUNDED: 'danger',
  CANCELLED: 'default',
};

export default function SalesPage() {
  const { isManager } = useAuth();
  const { notify } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Sale | null>(null);
  const [refunding, setRefunding] = useState(false);

  useEffect(() => {
    let active = true;
    salesApi
      .list()
      .then((list) => {
        if (active) setSales(list);
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

  async function refundSale(sale: Sale) {
    if (!window.confirm('Refund this sale? Stock will be restored.')) return;
    setRefunding(true);
    try {
      await salesApi.refund(sale.id);
      notify('Sale refunded and stock restored');
      const refreshed = await salesApi.list();
      setSales(refreshed);
      setSelected(null);
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setRefunding(false);
    }
  }

  const query = search.trim().toLowerCase();
  const visibleSales = sales.filter((sale) => {
    if (statusFilter && sale.status !== statusFilter) return false;
    if (!query) return true;
    return [sale.reference, sale.customer?.name, sale.user?.name, sale.paymentMethod]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <>
      <PageHeader title="Sales History" subtitle="All completed, refunded, and cancelled sales" />

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="sales-search">Search</Label>
            <Input
              id="sales-search"
              placeholder="Invoice, customer, cashier or payment..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="min-w-[180px]">
            <Label htmlFor="sales-status">Status</Label>
            <select
              id="sales-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <LoadingRow />
        ) : visibleSales.length === 0 ? (
          <EmptyState message="No sales recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Invoice</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Cashier</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Payment</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleSales.map((sale) => (
                  <tr
                    key={sale.id}
                    tabIndex={0}
                    role="button"
                    onClick={() => setSelected(sale)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelected(sale);
                      }
                    }}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="py-2.5 font-medium text-brand-700">{sale.reference}</td>
                    <td className="py-2.5 text-slate-500">{sale.customer?.name || 'Walk-in'}</td>
                    <td className="py-2.5 text-slate-500">{sale.user?.name}</td>
                    <td className="py-2.5 text-slate-500">{formatDateTime(sale.saleDate)}</td>
                    <td className="py-2.5 text-slate-500">{sale.paymentMethod.replace('_', ' ')}</td>
                    <td className="py-2.5">
                      <Badge tone={statusTone[sale.status]}>{sale.status}</Badge>
                    </td>
                    <td className="py-2.5 text-right font-semibold text-ink">{formatMoney(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Invoice ${selected.reference}` : ''}>
        {selected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-500">
              <div>
                <span className="text-slate-400">Customer:</span> {selected.customer?.name || 'Walk-in'}
              </div>
              <div>
                <span className="text-slate-400">Cashier:</span> {selected.user?.name}
              </div>
              <div>
                <span className="text-slate-400">Date:</span> {formatDateTime(selected.saleDate)}
              </div>
              <div>
                <span className="text-slate-400">Payment:</span> {selected.paymentMethod.replace('_', ' ')}
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-lg border border-line">
              {selected.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium text-slate-700">{item.product?.name}</div>
                    <div className="text-xs text-slate-400">
                      {formatQty(item.quantity, item.product?.unit || '')} × {formatMoney(item.unitPrice)}
                    </div>
                  </div>
                  <div className="font-medium text-slate-700">{formatMoney(item.subtotal)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatMoney(selected.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span>-{formatMoney(selected.discount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>+{formatMoney(selected.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-1 text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatMoney(selected.total)}</span>
              </div>
            </div>

            {isManager && selected.status === 'COMPLETED' ? (
              <Button variant="danger" className="w-full" loading={refunding} onClick={() => void refundSale(selected)}>
                {refunding ? 'Refunding…' : 'Refund Sale'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
