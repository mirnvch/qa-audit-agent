# Phase 3: Scale & Differentiate — Design Document

**Date:** 2026-03-06
**Status:** Approved

## 3.1 Embeddable Scan Widget (iframe)

**Route:** `/embed/scan` — public page, no header/sidebar/footer, scan form only.

Reuses `/scan` logic with URL query customization:
- `?theme=light|dark`
- `?accent=hex` (button color)
- `?ref=client-id` (tracking source)

Admin gets embed code in Settings. After scan completes: show score + CTA "View Full Report".

## 3.2 White-label Reports

New table `branding`: `logo_url`, `company_name`, `primary_color`, `accent_color`.

Applied to `/r/[code]` client portal: replaces QA Camp logo with custom branding.

Settings page gets "Branding" section with logo upload and color pickers.

## 3.3 Bulk Operations

**Reports page:** Checkbox per row + Select All. Bulk actions bar: "Send Email", "Export CSV", "Delete". CSV: company, domain, score, status, findings count, date.

**Leads page:** Checkbox + bulk "Export CSV".

## 3.4 Email Sequences

New table `email_sequences`: `id`, `name`, `steps` (jsonb array of `{delay_days, template_id}`).

New table `sequence_enrollments`: `id`, `report_id`, `sequence_id`, `current_step`, `next_send_at`, `status` (active/completed/cancelled).

Vercel Cron `/api/cron/follow-ups` (hourly): finds due enrollments, sends email via Resend, increments step or completes.

UI: `/sequences` page + creation form (name + steps with delay + template select).

## 3.5 Realtime Updates

Supabase Realtime subscription on `scan_requests`. Scan Queue page gets live status updates. Dashboard Quick Stats update on changes. Client hook `useRealtimeScans()`.

## 3.6 Analytics Dashboard (Recharts)

Route `/analytics` + sidebar item.

Charts:
- Scans per day (30 days) — BarChart
- Conversion funnel — FunnelChart
- Score distribution — Histogram
- Top domains by score — horizontal BarChart

Data via Supabase queries + JS aggregation.

## 3.7 Webhook/API

REST API:
- `POST /api/v1/scan` — create scan (API key auth)
- `GET /api/v1/reports/[id]` — get report
- `POST /api/v1/webhooks` — register webhook URL

Webhooks fire on: scan_completed, report_sent, report_viewed, report_replied.

New table `api_keys` (key, name, created_at). Settings page for management.

## 3.8 Multi-user + Roles

Roles: admin, operator, viewer.
- Admin: full access
- Operator: scan, email, leads. No settings/branding/API keys.
- Viewer: read-only

Table `user_roles` (user_id, role). RLS policies updated. Settings → Team section.
