# 🥩 Meat Shop Business Manager

A full-stack business management system for a retail meat shop: point-of-sale
checkout, inventory & stock tracking, supplier purchase orders, customer
accounts (with credit balances), expense tracking, and a live dashboard.

## Stack

The app is a single **Next.js 16 App Router** project. React 19 client pages
call local route handlers under `/api`, which use Prisma against a file-based
SQLite database. Authentication is JWT in an httpOnly cookie.

| Layer | Tech |
|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| API | Next.js route handlers, Zod validation |
| Data | Prisma ORM + SQLite (`prisma/dev.db`) |
| Charts | Recharts |

## Features

- **Authentication & roles** — JWT login, three roles (`ADMIN`, `MANAGER`, `CASHIER`) gating what each user can do.
- **Left sidebar navigation** — labelled, icon-backed main navigation with active state, user card and sign out; collapses to a compact rail on small screens.
- **Point of Sale (POS)** — tap-to-add product grid, live cart, discounts/tax, multiple payment methods (cash, card, mobile money, store credit, bank transfer), instant receipt. Stock is decremented atomically inside a DB transaction.
- **Inventory & products** — categories, per-unit pricing (kg/gram/piece/dozen), cost vs. selling price, reorder levels, low-stock alerts, manual stock adjustments (wastage/stocktake corrections) with a full audit trail (`StockMovement`).
- **Suppliers & purchases** — create purchase orders, then "receive" them to add stock and update cost price in one atomic step.
- **Customers** — contact info + running credit balance for customers who buy on account.
- **Sales history & refunds** — full invoice history with line items; refunding a sale restocks items and reverses any credit balance.
- **Expenses** — categorized shop expenses (rent, wages, utilities, etc.) factored into the dashboard's profit figure.
- **Dashboard** — today's revenue/orders, month-to-date revenue/profit, 14-day revenue trend chart, top-selling products, low-stock list, recent sales.

## Getting started

Requires Node.js 20+.

```bash
cp .env.example .env       # set a strong JWT_SECRET
npm install
npm run setup              # prisma generate + db push + demo seed
npm run dev                # http://localhost:3000
```

`npm run setup` creates `prisma/dev.db` and seeds demo users, categories, products, a supplier and a customer. To reset the demo data, delete `prisma/dev.db` and run `npm run setup` again.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@meatshop.com | Admin@123 |
| Cashier | cashier@meatshop.com | Cashier@123 |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Generate Prisma client and build for production |
| `npm start` | Start the production server |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Push the Prisma schema to SQLite |
| `npm run db:seed` | Seed demo data (safe to re-run) |
| `npm run setup` | Generate + push + seed in one step |

## Project layout

```
src/app/(app)/   authenticated pages (dashboard, POS, sales, products, …)
src/app/api/     route handlers (auth, users, products, purchases, sales, …)
src/components/  app shell, auth/toast providers and UI primitives
src/lib/         prisma client, auth, API client, endpoints, types, enums
prisma/          Prisma schema and seed script
backend/, frontend/  original pre-conversion sources (kept for reference)
```

To run in production: `npm run build && npm start`. Set `PORT` to override port 3000.
