'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/toast-provider';
import { Button, Input, Label } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { notify } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('admin@meatshop.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      notify('Welcome back!');
      router.replace('/');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(demo: 'admin' | 'cashier') {
    setError('');
    if (demo === 'admin') {
      setEmail('admin@meatshop.com');
      setPassword('Admin@123');
    } else {
      setEmail('cashier@meatshop.com');
      setPassword('Cashier@123');
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-slate-100 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg">
            <Icon name="meat" size={30} />
          </span>
          <h1 className="mt-3 font-display text-xl font-bold text-ink">Meat Shop Manager</h1>
          <p className="text-sm text-slate-500">Sign in to manage your shop</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4" aria-describedby={error ? 'login-error' : undefined}>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="username"
                placeholder="you@meatshop.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pr-12"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-slate-500 transition hover:text-ink"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>
            {error ? (
              <p id="login-error" role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <Icon name="alert" size={16} className="shrink-0" />
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-600">Demo accounts (from seed data)</p>
            <p>Admin: admin@meatshop.com / Admin@123</p>
            <p>Cashier: cashier@meatshop.com / Cashier@123</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => fillDemo('admin')}>
                Use admin demo
              </Button>
              <Button size="sm" variant="secondary" onClick={() => fillDemo('cashier')}>
                Use cashier demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
