-- QA Reports Phase 1 Migration
-- Tables, constraints, indexes, triggers, RLS, functions

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── Helper: updated_at trigger ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── QA Projects ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  normalized_name text NOT NULL UNIQUE CHECK (normalized_name ~ '^[a-z0-9]+$'),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]*$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_qa_projects
  BEFORE UPDATE ON qa_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Immutability protection for normalized_name
CREATE OR REPLACE FUNCTION protect_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.normalized_name IS DISTINCT FROM NEW.normalized_name THEN
    RAISE EXCEPTION 'normalized_name is immutable after creation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_normalized_name
  BEFORE UPDATE ON qa_projects
  FOR EACH ROW EXECUTE FUNCTION protect_normalized_name();

-- ─── QA Reports ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES qa_projects(id) ON DELETE CASCADE,
  period_from date NOT NULL,
  period_to date NOT NULL CHECK (period_to >= period_from),
  -- Snapshot fields
  framework text,
  ci text,
  failures int NOT NULL DEFAULT 0 CHECK (failures >= 0),
  -- Typed summary columns
  active_scope int NOT NULL CHECK (active_scope >= 0),
  total_scope int NOT NULL CHECK (total_scope >= 0),
  duplicates_deleted int NOT NULL DEFAULT 0 CHECK (duplicates_deleted >= 0),
  automated int NOT NULL CHECK (automated >= 0),
  discovered_tests int NOT NULL CHECK (discovered_tests >= 0),
  discovered_files int NOT NULL CHECK (discovered_files >= 0),
  discovered_static int NOT NULL CHECK (discovered_static >= 0),
  remaining int NOT NULL CHECK (remaining >= 0),
  remaining_planned int NOT NULL CHECK (remaining_planned >= 0),
  remaining_blocked int NOT NULL CHECK (remaining_blocked >= 0),
  -- Typed plan columns
  plan_automated int NOT NULL CHECK (plan_automated >= 0),
  plan_planned int NOT NULL CHECK (plan_planned >= 0),
  plan_blocked int NOT NULL CHECK (plan_blocked >= 0),
  plan_manual int NOT NULL CHECK (plan_manual >= 0),
  -- JSONB fields (not needed for trends)
  execution_groups jsonb NOT NULL DEFAULT '[]',
  recent_progress jsonb,
  needs_attention jsonb NOT NULL DEFAULT '[]',
  recommended_next jsonb NOT NULL DEFAULT '[]',
  ci_cd jsonb,
  -- Ingest metadata
  schema_version int NOT NULL DEFAULT 1,
  source_filename text,
  source_checksum text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Idempotency constraint
  UNIQUE (project_id, period_from, period_to)
);

CREATE INDEX idx_qa_reports_project_period ON qa_reports (project_id, period_to DESC);

CREATE TRIGGER set_updated_at_qa_reports
  BEFORE UPDATE ON qa_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── QA Report Modules ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_report_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES qa_reports(id) ON DELETE CASCADE,
  module_key text NOT NULL CHECK (module_key ~ '^[a-z0-9][a-z0-9_-]*$'),
  name text NOT NULL,
  done int NOT NULL CHECK (done >= 0),
  "left" int NOT NULL CHECK ("left" >= 0),
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (report_id, module_key)
);

CREATE INDEX idx_qa_report_modules_report ON qa_report_modules (report_id, sort_order);

-- ─── QA Report Sections ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_report_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES qa_reports(id) ON DELETE CASCADE,
  section text NOT NULL,
  type text NOT NULL CHECK (type IN ('covered', 'remaining')),
  done int,
  "left" int,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (report_id, section, type),
  -- Row-shape constraint
  CHECK (
    (type = 'covered' AND done IS NULL AND "left" IS NULL)
    OR
    (type = 'remaining' AND done IS NOT NULL AND "left" IS NOT NULL AND done >= 0 AND "left" >= 0)
  )
);

CREATE INDEX idx_qa_report_sections_report ON qa_report_sections (report_id, type, sort_order);

-- ─── QA Project Access ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES qa_projects(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE CHECK (code ~ '^[A-Za-z0-9_-]{22}$'),
  is_active boolean NOT NULL DEFAULT true,
  show_history boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_roles_uid_role ON user_roles (user_id, role);

-- ─── RLS ──────────────────────────────────────────────────────────────────
-- Role check helper
CREATE OR REPLACE FUNCTION has_qa_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'operator')
  );
$$;

ALTER TABLE qa_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_read" ON qa_projects FOR SELECT TO authenticated USING (has_qa_access());
CREATE POLICY "qa_write" ON qa_projects FOR ALL TO authenticated USING (has_qa_access()) WITH CHECK (has_qa_access());

ALTER TABLE qa_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_read" ON qa_reports FOR SELECT TO authenticated USING (has_qa_access());
CREATE POLICY "qa_write" ON qa_reports FOR ALL TO authenticated USING (has_qa_access()) WITH CHECK (has_qa_access());

ALTER TABLE qa_report_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_read" ON qa_report_modules FOR SELECT TO authenticated USING (has_qa_access());
CREATE POLICY "qa_write" ON qa_report_modules FOR ALL TO authenticated USING (has_qa_access()) WITH CHECK (has_qa_access());

ALTER TABLE qa_report_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_read" ON qa_report_sections FOR SELECT TO authenticated USING (has_qa_access());
CREATE POLICY "qa_write" ON qa_report_sections FOR ALL TO authenticated USING (has_qa_access()) WITH CHECK (has_qa_access());

ALTER TABLE qa_project_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_read" ON qa_project_access FOR SELECT TO authenticated USING (has_qa_access());
CREATE POLICY "qa_write" ON qa_project_access FOR ALL TO authenticated USING (has_qa_access()) WITH CHECK (has_qa_access());

-- ─── Ingest RPC ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ingest_qa_report(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_report_id uuid;
  v_normalized text;
  v_now timestamptz := now();
BEGIN
  -- Role check
  IF NOT has_qa_access() THEN
    RAISE EXCEPTION 'insufficient privileges: admin or operator role required';
  END IF;

  -- 1. Normalize project name
  v_normalized := regexp_replace(lower(p_payload->>'project'), '[^a-z0-9]', '', 'g');
  IF v_normalized = '' THEN
    RAISE EXCEPTION 'project name normalizes to empty string';
  END IF;

  -- 2. Concurrency-safe project lookup/create
  INSERT INTO qa_projects (name, normalized_name, slug)
  VALUES (p_payload->>'project', v_normalized, v_normalized)
  ON CONFLICT (normalized_name) DO NOTHING
  RETURNING id INTO v_project_id;

  IF v_project_id IS NULL THEN
    SELECT id INTO STRICT v_project_id
    FROM qa_projects WHERE normalized_name = v_normalized;
  ELSE
    -- New project: provision public access atomically
    INSERT INTO qa_project_access (project_id, code, is_active, show_history)
    VALUES (
      v_project_id,
      rtrim(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/=', '-_'), '='),
      true,
      true
    );
  END IF;

  -- 3. Upsert report
  INSERT INTO qa_reports (
    project_id, period_from, period_to,
    framework, ci, failures,
    active_scope, total_scope, duplicates_deleted,
    automated, discovered_tests, discovered_files, discovered_static,
    remaining, remaining_planned, remaining_blocked,
    plan_automated, plan_planned, plan_blocked, plan_manual,
    execution_groups, recent_progress, needs_attention, recommended_next, ci_cd,
    schema_version, source_filename, source_checksum, uploaded_by,
    created_at, updated_at
  )
  VALUES (
    v_project_id,
    (p_payload->'period'->>'from')::date,
    (p_payload->'period'->>'to')::date,
    p_payload->>'framework',
    p_payload->>'ci',
    COALESCE((p_payload->>'failures')::int, 0),
    (p_payload->'summary'->>'active_scope')::int,
    (p_payload->'summary'->>'total_scope')::int,
    COALESCE((p_payload->'summary'->>'duplicates_deleted')::int, 0),
    (p_payload->'summary'->>'automated')::int,
    (p_payload->'summary'->>'discovered_tests')::int,
    (p_payload->'summary'->>'discovered_files')::int,
    (p_payload->'summary'->>'discovered_static')::int,
    (p_payload->'summary'->>'remaining')::int,
    (p_payload->'summary'->>'remaining_planned')::int,
    (p_payload->'summary'->>'remaining_blocked')::int,
    (p_payload->'automation_plan'->>'automated')::int,
    (p_payload->'automation_plan'->>'planned')::int,
    (p_payload->'automation_plan'->>'blocked')::int,
    (p_payload->'automation_plan'->>'manual')::int,
    COALESCE(p_payload->'execution_groups', '[]'::jsonb),
    p_payload->'recent_progress',
    COALESCE(p_payload->'needs_attention', '[]'::jsonb),
    COALESCE(p_payload->'recommended_next', '[]'::jsonb),
    p_payload->'ci_cd',
    COALESCE((p_payload->'_meta'->>'schema_version')::int, 1),
    p_payload->'_meta'->>'source_filename',
    p_payload->'_meta'->>'source_checksum',
    auth.uid(),
    v_now, v_now
  )
  ON CONFLICT (project_id, period_from, period_to) DO UPDATE SET
    framework = EXCLUDED.framework,
    ci = EXCLUDED.ci,
    failures = EXCLUDED.failures,
    active_scope = EXCLUDED.active_scope,
    total_scope = EXCLUDED.total_scope,
    duplicates_deleted = EXCLUDED.duplicates_deleted,
    automated = EXCLUDED.automated,
    discovered_tests = EXCLUDED.discovered_tests,
    discovered_files = EXCLUDED.discovered_files,
    discovered_static = EXCLUDED.discovered_static,
    remaining = EXCLUDED.remaining,
    remaining_planned = EXCLUDED.remaining_planned,
    remaining_blocked = EXCLUDED.remaining_blocked,
    plan_automated = EXCLUDED.plan_automated,
    plan_planned = EXCLUDED.plan_planned,
    plan_blocked = EXCLUDED.plan_blocked,
    plan_manual = EXCLUDED.plan_manual,
    execution_groups = EXCLUDED.execution_groups,
    recent_progress = EXCLUDED.recent_progress,
    needs_attention = EXCLUDED.needs_attention,
    recommended_next = EXCLUDED.recommended_next,
    ci_cd = EXCLUDED.ci_cd,
    schema_version = EXCLUDED.schema_version,
    source_filename = EXCLUDED.source_filename,
    source_checksum = EXCLUDED.source_checksum,
    uploaded_by = EXCLUDED.uploaded_by,
    updated_at = v_now
  RETURNING id INTO v_report_id;

  -- 4. Replace child rows
  DELETE FROM qa_report_modules WHERE report_id = v_report_id;
  DELETE FROM qa_report_sections WHERE report_id = v_report_id;

  -- 5. Insert modules (WITH ORDINALITY for order preservation)
  INSERT INTO qa_report_modules (report_id, module_key, name, done, "left", sort_order)
  SELECT
    v_report_id,
    m.value->>'key',
    m.value->>'name',
    (m.value->>'done')::int,
    (m.value->>'left')::int,
    (m.ordinality - 1)::int
  FROM jsonb_array_elements(COALESCE(p_payload->'modules', '[]'::jsonb))
    WITH ORDINALITY AS m;

  -- 6. Insert fully_covered_sections
  INSERT INTO qa_report_sections (report_id, section, type, done, "left", sort_order)
  SELECT
    v_report_id,
    s.value #>> '{}',
    'covered',
    NULL,
    NULL,
    (s.ordinality - 1)::int
  FROM jsonb_array_elements(COALESCE(p_payload->'fully_covered_sections', '[]'::jsonb))
    WITH ORDINALITY AS s;

  -- 7. Insert heaviest_remaining
  INSERT INTO qa_report_sections (report_id, section, type, done, "left", sort_order)
  SELECT
    v_report_id,
    s.value->>'section',
    'remaining',
    (s.value->>'done')::int,
    (s.value->>'left')::int,
    (s.ordinality - 1)::int
  FROM jsonb_array_elements(COALESCE(p_payload->'heaviest_remaining', '[]'::jsonb))
    WITH ORDINALITY AS s;

  -- 8. Return result
  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'report_id', v_report_id
  );
END;
$$;

REVOKE ALL ON FUNCTION ingest_qa_report(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION ingest_qa_report(jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION ingest_qa_report(jsonb) TO authenticated;

-- ─── Public Read RPC ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_public_qa_report(
  p_code text,
  p_report_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access record;
  v_report record;
  v_project record;
BEGIN
  -- 1. Validate access code
  SELECT project_id, is_active, show_history, expires_at
  INTO v_access
  FROM qa_project_access
  WHERE code = p_code;

  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT v_access.is_active THEN RETURN NULL; END IF;
  IF v_access.expires_at IS NOT NULL AND v_access.expires_at < now() THEN RETURN NULL; END IF;

  -- 2. Get project
  SELECT name, slug INTO v_project
  FROM qa_projects WHERE id = v_access.project_id;

  -- 3. Resolve report
  IF p_report_id IS NOT NULL AND v_access.show_history THEN
    SELECT * INTO v_report FROM qa_reports
    WHERE id = p_report_id AND project_id = v_access.project_id;
  END IF;

  IF v_report IS NULL THEN
    SELECT * INTO v_report FROM qa_reports
    WHERE project_id = v_access.project_id
    ORDER BY period_to DESC LIMIT 1;
  END IF;

  IF v_report IS NULL THEN RETURN NULL; END IF;

  -- 4. Build shaped payload
  RETURN jsonb_build_object(
    'project', jsonb_build_object(
      'name', v_project.name
    ),
    'report', jsonb_build_object(
      'id', v_report.id,
      'period_from', v_report.period_from,
      'period_to', v_report.period_to,
      'framework', v_report.framework,
      'ci', v_report.ci,
      'failures', v_report.failures,
      'active_scope', v_report.active_scope,
      'total_scope', v_report.total_scope,
      'automated', v_report.automated,
      'discovered_tests', v_report.discovered_tests,
      'discovered_files', v_report.discovered_files,
      'discovered_static', v_report.discovered_static,
      'remaining', v_report.remaining,
      'remaining_planned', v_report.remaining_planned,
      'remaining_blocked', v_report.remaining_blocked,
      'plan_automated', v_report.plan_automated,
      'plan_planned', v_report.plan_planned,
      'plan_blocked', v_report.plan_blocked,
      'plan_manual', v_report.plan_manual,
      'execution_groups', v_report.execution_groups,
      'recent_progress', v_report.recent_progress,
      'needs_attention', v_report.needs_attention,
      'recommended_next', v_report.recommended_next,
      'ci_cd', v_report.ci_cd
    ),
    'modules', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('name', m.name, 'done', m.done, 'left', m."left")
        ORDER BY m.sort_order
      ), '[]'::jsonb)
      FROM qa_report_modules m WHERE m.report_id = v_report.id
    ),
    'covered_sections', (
      SELECT COALESCE(jsonb_agg(s.section ORDER BY s.sort_order), '[]'::jsonb)
      FROM qa_report_sections s
      WHERE s.report_id = v_report.id AND s.type = 'covered'
    ),
    'remaining_sections', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object('section', s.section, 'done', s.done, 'left', s."left")
        ORDER BY s.sort_order
      ), '[]'::jsonb)
      FROM qa_report_sections s
      WHERE s.report_id = v_report.id AND s.type = 'remaining'
    ),
    'show_history', v_access.show_history,
    'history', CASE WHEN v_access.show_history THEN (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'period_from', r.period_from,
          'period_to', r.period_to,
          'automated', r.automated,
          'active_scope', r.active_scope
        )
        ORDER BY r.period_to DESC
      ), '[]'::jsonb)
      FROM (
        SELECT id, period_from, period_to, automated, active_scope
        FROM qa_reports WHERE project_id = v_access.project_id
        ORDER BY period_to DESC LIMIT 20
      ) r
    ) ELSE '[]'::jsonb END
  );
END;
$$;

REVOKE ALL ON FUNCTION get_public_qa_report(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_qa_report(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_public_qa_report(text, uuid) TO authenticated;
