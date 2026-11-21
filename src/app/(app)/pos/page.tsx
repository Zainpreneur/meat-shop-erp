'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast-provider';
import { Badge, Button, Card, Input, Label, LoadingRow, PageHeader, Select } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';
import { customersApi, productsApi, salesApi } from '@/lib/endpoints';
import { formatMoney, formatQty } from '@/lib/format';
import type { Customer, PaymentMethod, Product, Sale } from '@/lib/types';

interface CartLine {
  product: Product;
  quantity: number;
}

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'MOBILE_MONEY', 'CREDIT', 'BANK_TRANSFER'];

export default function PosPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [lastReceipt, setLastReceipt] = useState<Sale | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      productsApi
        .list({ search: search || undefined, active: true })
        .then((list) => {
          if (active) setProducts(list);
        })
        .catch((err) => {
          if (active) notify(apiErrorMessage(err), 'error');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, notify]);

  useEffect(() => {
    let active = true;
    customersApi
      .list()
      .then((list) => {
        if (active) setCustomers(list);
      })
      .catch((err) => {
        if (active) notify(apiErrorMessage(err), 'error');
      });
    return () => {
      active = false;
    };
  }, [notify]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity * line.product.sellingPrice, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));

  function addToCart(product: Product) {
    const existing = cart.find((line) => line.product.id === product.id);
    if (existing) {
      if (existing.quantity + 1 > product.stockQty) {
        notify(`Only ${formatQty(product.stockQty, product.unit)} left in stock`, 'error');
        return;
      }
      setCart((prev) =>
        prev.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line))
      );
      return;
    }
    if (product.stockQty <= 0) {
      notify('Out of stock', 'error');
      return;
    }
    setCart((prev) => [...prev, { product, quantity: 1 }]);
  }

  function updateQty(productId: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((line) => (line.product.id === productId ? { ...line, quantity: Math.max(0, quantity) } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
  }

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const sale = await salesApi.create({
        customerId: customerId || null,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        paymentMethod,
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          unitPrice: line.product.sellingPrice,
        })),
      });
      notify(`Sale ${sale.reference} completed!`);
      setLastReceipt(sale);
      setCart([]);
      setDiscount('0');
      setTax('0');
      setCustomerId('');
      const refreshed = await productsApi.list({ active: true });
      setProducts(refreshed);
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New Sale (POS)"
        subtitle={user ? `Selling as ${user.name}` : 'Quick product selection and checkout'}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="relative mb-4">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          {loading ? (
            <LoadingRow />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  disabled={product.stockQty <= 0}
                  className="flex flex-col items-start rounded-xl border border-line bg-surface p-3 text-left shadow-sm transition hover:border-brand-400 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon name="meat" size={20} />
                  </span>
                  <span className="mt-1.5 text-sm font-semibold text-ink">{product.name}</span>
                  <span className="text-xs text-slate-400">{product.sku}</span>
                  <span className="mt-2 flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-bold text-brand-600">{formatMoney(product.sellingPrice)}</span>
                    <Badge tone={product.stockQty <= product.reorderLevel ? 'warning' : 'default'}>
                      {formatQty(product.stockQty, product.unit)}
                    </Badge>
                  </span>
                </button>
              ))}
              {products.length === 0 ? (
                <div className="col-span-full py-12 text-center text-sm text-slate-400">
                  No products match your search.
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div>
          <Card className="lg:sticky lg:top-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Current Sale</h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Tap a product to add it to the cart.</div>
            ) : (
              <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                {cart.map((line) => (
                  <div key={line.product.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-700">{line.product.name}</div>
                      <div className="text-xs text-slate-400">
                        {formatMoney(line.product.sellingPrice)} / {line.product.unit}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      aria-label={`Quantity of ${line.product.name}`}
                      value={line.quantity}
                      onChange={(event) => updateQty(line.product.id, Number(event.target.value))}
                      className="w-16 rounded border border-line px-1.5 py-1 text-right text-sm"
                    />
                    <div className="w-16 text-right font-medium text-slate-700">
                      {formatMoney(line.quantity * line.product.sellingPrice)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.product.id)}
                      aria-label={`Remove ${line.product.name}`}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <div>
                <Label htmlFor="pos-customer">Customer</Label>
                <Select id="pos-customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="pos-discount">Discount</Label>
                  <Input
                    id="pos-discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pos-tax">Tax</Label>
                  <Input
                    id="pos-tax"
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(event) => setTax(event.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pos-payment">Payment Method</Label>
                <Select
                  id="pos-payment"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Discount</span>
                <span>-{formatMoney(Number(discount) || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>+{formatMoney(Number(tax) || 0)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold text-ink">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>

            <Button className="mt-4 w-full" disabled={cart.length === 0} loading={submitting} onClick={checkout}>
              {submitting ? 'Processing…' : `Charge ${formatMoney(total)}`}
            </Button>
          </Card>

          {lastReceipt ? (
            <Card className="mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Last Receipt</h3>
                <Badge tone="success">{lastReceipt.reference}</Badge>
              </div>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                {lastReceipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity} × {item.product?.name}
                    </span>
                    <span>{formatMoney(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between border-t border-line pt-2 text-sm font-semibold text-ink">
                <span>Total</span>
                <span>{formatMoney(lastReceipt.total)}</span>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
