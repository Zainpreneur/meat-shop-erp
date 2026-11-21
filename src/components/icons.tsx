'use client';

import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'meat'
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'products'
  | 'purchases'
  | 'suppliers'
  | 'customers'
  | 'expenses'
  | 'users'
  | 'plus'
  | 'search'
  | 'logout'
  | 'menu'
  | 'close'
  | 'trash'
  | 'edit'
  | 'refresh'
  | 'alert'
  | 'check'
  | 'chevronRight'
  | 'chevronDown'
  | 'eye'
  | 'eyeOff';

const paths: Record<IconName, ReactNode> = {
  meat: (
    <>
      <path d="M5.6 14.2C4.6 10.2 7.2 6.2 11.2 5.4c2.4-.5 4.9.3 6.5 2l1.3 1.3c1.5 1.6 2 3.9 1.3 6-.8 2.5-3 4.2-5.6 4.3H9.8a5 5 0 0 1-4.2-4.8Z" />
      <path d="M6.2 19.2 4.2 21M17.4 5.1 19.3 3M4.5 16.8a2 2 0 1 1 2.4-1.4M18.7 8.6a2 2 0 1 0-2.5-2" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" />
    </>
  ),
  pos: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  sales: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="m7 15 4-5 3 3 5-7" />
      <path d="M15 6h4v4" />
    </>
  ),
  products: (
    <>
      <path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </>
  ),
  purchases: (
    <>
      <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
      <path d="M12 14v5M9.5 16.5h5" />
    </>
  ),
  suppliers: (
    <>
      <path d="M3 6h11v10H3V6Z" />
      <path d="M14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>
  ),
  customers: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-1a6 6 0 0 1 12 0v1" />
      <path d="M16.5 5.5a3 3 0 0 1 0 5.8M17.5 14a6 6 0 0 1 3.5 5v1" />
    </>
  ),
  expenses: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  users: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M17 12v4M20 12v3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
      <path d="m15 16 4-4-4-4M19 12H9" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </>
  ),
  edit: (
    <>
      <path d="m4 20 4.5-1 11-11a2.12 2.12 0 0 0-3-3l-11 11L4 20Z" />
      <path d="m14.5 6.5 3 3" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.4 6.5" />
      <path d="M20 4v7h-7" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  check: <path d="m5 12 5 5L20 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.1 3.6M6.2 8.1C3.5 9.8 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3.2-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.8, className = '', ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
