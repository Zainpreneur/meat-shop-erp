import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AuthProvider } from '@/components/auth-provider';
import { ToastProvider } from '@/components/toast-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Meat Shop Manager',
    template: '%s · Meat Shop',
  },
  description: 'Point of sale, inventory, purchases and business reporting for your meat shop.',
  applicationName: 'Meat Shop Business Software',
};

export const viewport: Viewport = {
  themeColor: '#e11d48',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
