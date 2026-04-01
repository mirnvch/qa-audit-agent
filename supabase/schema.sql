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
  first_viewed_at timestamptz,
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

-- ═══════════════════════════════════════════════════════════════════════════
-- QA Reports (added via migration 20260401_qa_reports.sql)
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

create or replace function update_updated_at()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

-- QA Projects
create table if not exists qa_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique check (normalized_name ~ '^[a-z0-9]+$'),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at_qa_projects
  before update on qa_projects
  for each row execute function update_updated_at();

create or replace function protect_normalized_name()
returns trigger as $$
begin
  if OLD.normalized_name is distinct from NEW.normalized_name then
    raise exception 'normalized_name is immutable after creation';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger protect_normalized_name
  before update on qa_projects
  for each row execute function protect_normalized_name();

-- QA Reports
create table if not exists qa_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references qa_projects(id) on delete cascade,
  period_from date not null,
  period_to date not null check (period_to >= period_from),
  framework text,
  ci text,
  failures int not null default 0 check (failures >= 0),
  active_scope int not null check (active_scope >= 0),
  total_scope int not null check (total_scope >= 0),
  duplicates_deleted int not null default 0 check (duplicates_deleted >= 0),
  automated int not null check (automated >= 0),
  discovered_tests int not null check (discovered_tests >= 0),
  discovered_files int not null check (discovered_files >= 0),
  discovered_static int not null check (discovered_static >= 0),
  remaining int not null check (remaining >= 0),
  remaining_planned int not null check (remaining_planned >= 0),
  remaining_blocked int not null check (remaining_blocked >= 0),
  plan_automated int not null check (plan_automated >= 0),
  plan_planned int not null check (plan_planned >= 0),
  plan_blocked int not null check (plan_blocked >= 0),
  plan_manual int not null check (plan_manual >= 0),
  execution_groups jsonb not null default '[]',
  recent_progress jsonb,
  needs_attention jsonb not null default '[]',
  recommended_next jsonb not null default '[]',
  ci_cd jsonb,
  schema_version int not null default 1,
  source_filename text,
  source_checksum text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, period_from, period_to)
);

create index idx_qa_reports_project_period on qa_reports (project_id, period_to desc);

create trigger set_updated_at_qa_reports
  before update on qa_reports
  for each row execute function update_updated_at();

-- QA Report Modules
create table if not exists qa_report_modules (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references qa_reports(id) on delete cascade,
  module_key text not null check (module_key ~ '^[a-z0-9][a-z0-9_-]*$'),
  name text not null,
  done int not null check (done >= 0),
  "left" int not null check ("left" >= 0),
  sort_order int not null default 0,
  unique (report_id, module_key)
);

create index idx_qa_report_modules_report on qa_report_modules (report_id, sort_order);

-- QA Report Sections
create table if not exists qa_report_sections (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references qa_reports(id) on delete cascade,
  section text not null,
  type text not null check (type in ('covered', 'remaining')),
  done int,
  "left" int,
  sort_order int not null default 0,
  unique (report_id, section, type),
  check (
    (type = 'covered' and done is null and "left" is null)
    or
    (type = 'remaining' and done is not null and "left" is not null and done >= 0 and "left" >= 0)
  )
);

create index idx_qa_report_sections_report on qa_report_sections (report_id, type, sort_order);

-- QA Project Access
create table if not exists qa_project_access (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references qa_projects(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Za-z0-9_-]{22}$'),
  is_active boolean not null default true,
  show_history boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_roles_uid_role on user_roles (user_id, role);

-- RLS for QA tables
create or replace function has_qa_access()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role in ('admin', 'operator')
  );
$$;

alter table qa_projects enable row level security;
create policy "qa_read" on qa_projects for select to authenticated using (has_qa_access());
create policy "qa_write" on qa_projects for all to authenticated using (has_qa_access()) with check (has_qa_access());

alter table qa_reports enable row level security;
create policy "qa_read" on qa_reports for select to authenticated using (has_qa_access());
create policy "qa_write" on qa_reports for all to authenticated using (has_qa_access()) with check (has_qa_access());

alter table qa_report_modules enable row level security;
create policy "qa_read" on qa_report_modules for select to authenticated using (has_qa_access());
create policy "qa_write" on qa_report_modules for all to authenticated using (has_qa_access()) with check (has_qa_access());

alter table qa_report_sections enable row level security;
create policy "qa_read" on qa_report_sections for select to authenticated using (has_qa_access());
create policy "qa_write" on qa_report_sections for all to authenticated using (has_qa_access()) with check (has_qa_access());

alter table qa_project_access enable row level security;
create policy "qa_read" on qa_project_access for select to authenticated using (has_qa_access());
create policy "qa_write" on qa_project_access for all to authenticated using (has_qa_access()) with check (has_qa_access());
