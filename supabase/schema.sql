-- QA Camp Admin Panel — Database Schema
-- Run this in Supabase SQL Editor

-- Companies (scanned websites)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique not null,
  contact_name text,
  contact_email text,
  created_at timestamptz default now()
);

-- Reports
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade not null,
  code text unique not null,
  status text not null default 'draft' check (status in ('draft','sent','viewed','replied','expired')),
  score int check (score >= 0 and score <= 100),
  score_calculation text,
  summary text,
  tier text check (tier in ('small','medium','large','enterprise')),
  audit_date date,
  pages_checked text[] default '{}',
  skipped_checks text[] default '{}',
  positives text[] default '{}',
  expires_at timestamptz,
  view_count int default 0,
  created_at timestamptz default now()
);

-- Findings
create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade not null,
  finding_id text not null,
  severity text not null check (severity in ('critical','moderate','minor')),
  confidence text check (confidence in ('high','medium','low')),
  category text,
  title text not null,
  description text,
  business_impact text,
  page text,
  steps_to_reproduce text[] default '{}',
  evidence jsonb default '{}',
  created_at timestamptz default now()
);

-- Activity Log
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade not null,
  action text not null check (action in ('scanned','sent','viewed','replied','converted','expired')),
  details text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_reports_code on reports(code);
create index if not exists idx_reports_status on reports(status);
create index if not exists idx_reports_company on reports(company_id);
create index if not exists idx_findings_report on findings(report_id);
create index if not exists idx_findings_severity on findings(severity);
create index if not exists idx_activity_report on activity_log(report_id);
create index if not exists idx_activity_created on activity_log(created_at desc);

-- Enable RLS
alter table companies enable row level security;
alter table reports enable row level security;
alter table findings enable row level security;
alter table activity_log enable row level security;

-- Admin (authenticated) full access
create policy "Admin full access companies" on companies for all using (auth.role() = 'authenticated');
create policy "Admin full access reports" on reports for all using (auth.role() = 'authenticated');
create policy "Admin full access findings" on findings for all using (auth.role() = 'authenticated');
create policy "Admin full access activity" on activity_log for all using (auth.role() = 'authenticated');

-- Public read for client portal (anon can read reports/findings by code)
create policy "Public read reports" on reports for select to anon using (true);
create policy "Public read findings" on findings for select to anon using (true);
create policy "Public read companies" on companies for select to anon using (true);

-- Public can update view_count (for tracking)
create policy "Public update view count" on reports for update to anon using (true) with check (true);

-- Public can insert activity (for view tracking)
create policy "Public insert activity" on activity_log for insert to anon with check (true);

-- Scan Requests (self-service scan queue)
create table if not exists scan_requests (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  domain text,
  status text not null default 'pending'
    check (status in ('pending', 'scanning', 'completed', 'failed')),
  contact_name text,
  contact_email text,
  report_id uuid references reports(id) on delete set null,
  error_message text,
  ip_address text,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_scan_requests_status on scan_requests(status);
create index if not exists idx_scan_requests_ip on scan_requests(ip_address, created_at desc);

alter table scan_requests enable row level security;

create policy "Admin full access scan_requests"
  on scan_requests for all using (auth.role() = 'authenticated');
create policy "Public insert scan_requests"
  on scan_requests for insert to anon with check (true);
create policy "Public read scan_requests"
  on scan_requests for select to anon using (true);

-- Email Templates
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  variables text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table email_templates enable row level security;

create policy "Admin full access email_templates"
  on email_templates for all using (auth.role() = 'authenticated');

-- Branding / white-label
create table if not exists branding (
  id uuid primary key default gen_random_uuid(),
  logo_url text,
  company_name text,
  primary_color text,
  accent_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table branding enable row level security;
create policy "Authenticated users can manage branding" on branding for all using (auth.role() = 'authenticated');
create policy "Anyone can read branding" on branding for select using (true);

-- Email sequences
create table if not exists email_sequences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  steps jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table email_sequences enable row level security;
create policy "Authenticated users can manage sequences" on email_sequences for all using (auth.role() = 'authenticated');

-- Sequence enrollments
create table if not exists sequence_enrollments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  sequence_id uuid references email_sequences(id) on delete cascade,
  current_step integer default 0,
  next_send_at timestamptz,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

alter table sequence_enrollments enable row level security;
create policy "Authenticated users can manage enrollments" on sequence_enrollments for all using (auth.role() = 'authenticated');

-- API Keys
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key text unique not null,
  created_at timestamptz default now()
);

alter table api_keys enable row level security;
create policy "Authenticated users can manage api_keys" on api_keys for all using (auth.role() = 'authenticated');

-- Webhooks
create table if not exists webhooks (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  events text[] default '{}',
  active boolean default true,
  created_at timestamptz default now()
);

alter table webhooks enable row level security;
create policy "Authenticated users can manage webhooks" on webhooks for all using (auth.role() = 'authenticated');

-- User roles
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null default 'viewer' check (role in ('admin', 'operator', 'viewer')),
  created_at timestamptz default now(),
  unique(user_id)
);

alter table user_roles enable row level security;
create policy "Authenticated users can read roles" on user_roles for select using (auth.role() = 'authenticated');
create policy "Admins can manage roles" on user_roles for all using (auth.role() = 'authenticated');
