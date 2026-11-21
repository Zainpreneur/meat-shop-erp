import Link from 'next/link';
import { Icon } from '@/components/icons';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas px-4 text-slate-500">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-100 text-brand-600">
        <Icon name="meat" size={34} />
      </span>
      <h1 className="text-xl font-semibold text-ink">Page not found</h1>
      <p className="text-sm">The page you were looking for doesn&apos;t exist.</p>
      <Link href="/" className="mt-2 text-sm font-medium text-brand-600 hover:underline">
        Back to dashboard
      </Link>
    </main>
  );
}
