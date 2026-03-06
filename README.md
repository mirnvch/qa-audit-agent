# QA Audit Agent

Automated website QA audit platform. Scans websites for quality issues (UX, accessibility, performance, SEO) and generates actionable reports for clients.

## Architecture

```
admin/          → Next.js 16 admin panel + client portal
scripts/        → CLI worker (scan execution, report upload)
supabase/       → Database schema, migrations, config
```

### Admin Panel (`/dashboard`, `/reports`, `/scans`)

- **Dashboard** — overview stats, recent activity
- **Reports** — manage audit reports, filter by status (draft/sent/viewed/replied)
- **Scan Queue** — incoming scan requests with status tracking

### Client Portal (`/r/[code]`)

- Public report view by unique code
- View tracking (count + activity log)

### Self-Service Scan (`/scan`)

- Public form to request a website audit
- Real-time status polling (`/scan/status/[id]`)

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **UI:** Tailwind CSS 4, shadcn/ui, Radix UI, Lucide icons
- **Theme:** Light/dark toggle via next-themes
- **Language:** TypeScript (strict mode)

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase project ([supabase.com](https://supabase.com))

### Setup

```bash
cd admin
npm install
```

Create `admin/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run the database schema in Supabase SQL Editor:

```bash
# File: admin/supabase/schema.sql
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `companies` | Scanned websites (domain, contact info) |
| `reports` | Audit reports with scores and status |
| `findings` | Individual issues (critical/moderate/minor) |
| `activity_log` | Event tracking (scanned, sent, viewed, replied) |
| `scan_requests` | Self-service scan queue |

RLS enabled on all tables. Admin (authenticated) has full access; anon has read-only access to reports + can submit scan requests.

## Project Structure

```
admin/src/
├── app/
│   ├── (admin)/           # Authenticated admin routes
│   │   ├── dashboard/
│   │   ├── reports/
│   │   └── scans/
│   ├── r/[code]/          # Public client portal
│   ├── scan/              # Public scan request form
│   ├── login/
│   └── api/public/        # Public API endpoints
├── components/
│   ├── ui/                # shadcn/ui primitives
│   └── ...                # App-specific components
└── lib/
    └── supabase/          # Client, types, service helpers
```

## License

Private — All rights reserved.
