'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useToast } from '@/components/toast-provider';
import { Badge, Card, EmptyState, LoadingRow, PageHeader, StatCard } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';
import { dashboardApi } from '@/lib/endpoints';
import { formatDateTime, formatMoney, formatQty } from '@/lib/format';
import type { DashboardSummary } from '@/lib/types';

export default function DashboardPage() {
  const { notify } = useToast();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const summary = await dashboardApi.summary();
      setData(summary);
      setError('');
    } catch (err) {
      setError(apiErrorMessage(err));
      notify(apiErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const header = <PageHeader title="Dashboard" subtitle="Today's snapshot of your meat shop" />;

  if (loading) {
    return (
      <>
        {header}
        <LoadingRow />
      </>
    );
  }

  if (!data) {
    return (
      <>
        {header}
        <Card>
          <EmptyState message={error || 'Unable to load the dashboard right now.'} />
        </Card>
      </>
    );
  }

  const trendData = data.revenueTrend.map((trend) => ({
    ...trend,
    label: new Date(trend.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  return (
    <>
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Revenue"
          value={formatMoney(data.todayRevenue)}
          hint={`${data.todayOrders} orders today`}
        />
        <StatCard
          label="This Month's Revenue"
          value={formatMoney(data.monthRevenue)}
          hint={`${data.monthOrders} orders`}
        />
        <StatCard
          label="This Month's Profit"
          value={formatMoney(data.monthProfit)}
          hint={`Expenses: ${formatMoney(data.monthExpenseTotal)}`}
          tone={data.monthProfit >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          label="Low Stock Alerts"
          value={String(data.lowStockCount)}
          hint={`of ${data.totalProducts} active products`}
          tone={data.lowStockCount > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Revenue Trend (last 14 days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip formatter={(value: unknown) => formatMoney(Number(value))} />
              <Area type="monotone" dataKey="revenue" stroke="#e11d48" strokeWidth={2} fill="url(#revenueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Low Stock Products</h3>
          {data.lowStockProducts.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">All stock levels healthy 🎉</div>
          ) : (
            <ul className="space-y-2.5">
              {data.lowStockProducts.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-slate-700">{product.name}</span>
                  <Badge tone={product.stockQty <= 0 ? 'danger' : 'warning'}>
                    {formatQty(product.stockQty, product.unit)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent Sales</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2">Invoice</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="py-2 font-medium text-slate-700">{sale.reference}</td>
                    <td className="py-2 text-slate-500">{sale.customer?.name || 'Walk-in'}</td>
                    <td className="py-2 text-slate-500">{formatDateTime(sale.saleDate)}</td>
                    <td className="py-2 text-right font-medium text-slate-700">{formatMoney(sale.total)}</td>
                  </tr>
                ))}
                {data.recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No sales yet
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Top Products (14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topProducts} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip formatter={(value: unknown) => formatMoney(Number(value))} />
              <Bar dataKey="revenue" fill="#e11d48" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </>
  );
}
