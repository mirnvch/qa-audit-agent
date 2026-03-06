# Phase 2: Core Pipeline — Design Document

**Date:** 2026-03-06
**Status:** Approved

## 2.1 Email Integration (Resend)

**Flow:** Admin opens report → "Send Email" → select template → variables auto-substituted → preview → send via Resend → report status → "sent" → activity_log entry.

**Components:**
- `SendEmailDialog` — modal: template select → preview with substituted data → Send button
- Server action `sendReportEmail` — Resend API call, update report status, write activity_log
- `resend` npm package, API key in `RESEND_API_KEY` env var
- From address: `EMAIL_FROM` env var (e.g. `noreply@qacamp.com`)

**Variables:** company_name, contact_name, report_link, score, domain, findings_count — extracted from report + company data.

## 2.2 Scan Queue Management

**Actions:**
- `cancelScan(id)` — status → "failed", error_message = "Cancelled by admin"
- `retryScan(id)` — status → "pending", clear error_message/started_at/completed_at
- Buttons in dropdown menu per scan row

## 2.3 Company Detail Page

**Route:** `/companies/[id]`

**Layout:**
- Header: company name, domain (link), contact info, lead status badge
- Timeline: chronological feed from activity_log (icons + timestamps)
- Reports table: all reports for company with score, status, date

## 2.4 Activity Log Auto-Write

All server actions write to activity_log:
- `sendReportEmail` → "sent"
- `deleteReport` → "deleted" (new action type)
- `createScanRequest` → "scanned"
- Existing: `updateReportStatus`, client portal view tracking

Extended `ActivityAction` type: + 'deleted' + 'email_sent'

## 2.5 Dashboard Real Data

Remove remaining mock data from report pages. Dashboard already shows real data (zeros when empty, from Phase 1).
