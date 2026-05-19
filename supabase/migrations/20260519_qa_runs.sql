-- QA Runs Migration
-- Per-execution test-run reports (daily / nightly / ad-hoc).
-- Distinct from qa_reports (which holds coverage-snapshot rollups).
-- Mirrors the qa_reports project-autocreate + service-role-ingest pattern.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── qa_runs table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qa_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES qa_projects(id) ON DELETE CASCADE,
  -- Producer-supplied run identifier (Bitbucket build number, UUID, etc.).
  -- Free-form text; uniqueness is enforced per project so different projects
  -- can re-use build numbers without colliding.
  run_id text NOT NULL CHECK (length(run_id) > 0 AND length(run_id) <= 200),
  kind text NOT NULL CHECK (kind IN ('daily', 'nightly', 'ad-hoc')),
  env text NOT NULL CHECK (length(env) > 0 AND length(env) <= 32),
  branch text NOT NULL CHECK (length(branch) > 0),
  commit_sha text NOT NULL CHECK (commit_sha ~ '^[0-9a-f]{7,64}$'),
  pipeline text NOT NULL CHECK (length(pipeline) > 0),
  build_url text,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL CHECK (finished_at >= started_at),
  duration_ms int NOT NULL CHECK (duration_ms >= 0),
  -- Denormalized aggregate counts for fast list-page queries
  total int NOT NULL CHECK (total >= 0),
  passed int NOT NULL CHECK (passed >= 0),
  failed int NOT NULL CHECK (failed >= 0),
  skipped int NOT NULL CHECK (skipped >= 0),
  flaky int NOT NULL DEFAULT 0 CHECK (flaky >= 0),
  -- Structured jsonb payloads
  runners jsonb NOT NULL DEFAULT '[]',         -- [{ name, total, passed, failed, skipped, duration_ms }]
  categories jsonb NOT NULL DEFAULT '[]',      -- [{ id, label, total, passed, failed, skipped }]
  tests jsonb NOT NULL DEFAULT '[]',           -- [{ file, title, category_id, sub_area, testrail_ids, status, duration_ms, failure_messages }]
  -- Ingest metadata
  schema_version int NOT NULL DEFAULT 1,
  source_checksum text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Idempotency: same (project, producer-run-id) replaces the existing row.
  UNIQUE (project_id, run_id)
);

CREATE INDEX idx_qa_runs_project_started ON qa_runs (project_id, started_at DESC);
CREATE INDEX idx_qa_runs_started ON qa_runs (started_at DESC);
CREATE INDEX idx_qa_runs_kind ON qa_runs (kind);

CREATE TRIGGER set_updated_at_qa_runs
  BEFORE UPDATE ON qa_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row-Level Security ──────────────────────────────────────────────────
ALTER TABLE qa_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "qa_read" ON qa_runs FOR SELECT TO authenticated USING (has_qa_access());
CREATE POLICY "qa_write" ON qa_runs FOR ALL TO authenticated USING (has_qa_access()) WITH CHECK (has_qa_access());

-- ─── Ingest core (project autocreate + upsert) ───────────────────────────
CREATE OR REPLACE FUNCTION ingest_qa_run_core(p_payload jsonb, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_name text;
  v_normalized_name text;
  v_slug text;
  v_project_id uuid;
  v_run_id text;
  v_qa_run_id uuid;
BEGIN
  v_project_name := p_payload->>'project';
  IF v_project_name IS NULL OR length(trim(v_project_name)) = 0 THEN
    RAISE EXCEPTION 'project name is required';
  END IF;

  -- Derive normalized_name (matches qa_projects CHECK '^[a-z0-9]+$')
  v_normalized_name := lower(regexp_replace(v_project_name, '[^A-Za-z0-9]+', '', 'g'));
  IF length(v_normalized_name) = 0 THEN
    RAISE EXCEPTION 'project name must contain at least one alphanumeric character';
  END IF;

  -- Derive slug (matches qa_projects CHECK '^[a-z0-9][a-z0-9-]*$')
  v_slug := lower(regexp_replace(v_project_name, '[^A-Za-z0-9-]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');
  IF length(v_slug) = 0 OR v_slug !~ '^[a-z0-9]' THEN
    v_slug := v_normalized_name;
  END IF;

  -- Get-or-create qa_project. normalized_name is the uniqueness key.
  SELECT id INTO v_project_id FROM qa_projects WHERE normalized_name = v_normalized_name;
  IF v_project_id IS NULL THEN
    INSERT INTO qa_projects (name, normalized_name, slug)
    VALUES (v_project_name, v_normalized_name, v_slug)
    RETURNING id INTO v_project_id;
  END IF;

  v_run_id := p_payload->'run'->>'run_id';
  IF v_run_id IS NULL OR length(trim(v_run_id)) = 0 THEN
    RAISE EXCEPTION 'run.run_id is required';
  END IF;

  -- Upsert the run row keyed by (project_id, run_id)
  INSERT INTO qa_runs (
    project_id, run_id, kind, env, branch, commit_sha, pipeline, build_url,
    started_at, finished_at, duration_ms,
    total, passed, failed, skipped, flaky,
    runners, categories, tests,
    schema_version, source_checksum, uploaded_by
  )
  VALUES (
    v_project_id,
    v_run_id,
    p_payload->'run'->>'kind',
    p_payload->'run'->>'env',
    p_payload->'run'->>'branch',
    p_payload->'run'->>'commit_sha',
    p_payload->'run'->>'pipeline',
    p_payload->'run'->>'build_url',
    (p_payload->'run'->>'started_at')::timestamptz,
    (p_payload->'run'->>'finished_at')::timestamptz,
    (p_payload->'run'->>'duration_ms')::int,
    (p_payload->'totals'->>'total')::int,
    (p_payload->'totals'->>'passed')::int,
    (p_payload->'totals'->>'failed')::int,
    (p_payload->'totals'->>'skipped')::int,
    COALESCE((p_payload->'totals'->>'flaky')::int, 0),
    COALESCE(p_payload->'runners', '[]'::jsonb),
    COALESCE(p_payload->'categories', '[]'::jsonb),
    COALESCE(p_payload->'tests', '[]'::jsonb),
    COALESCE((p_payload->'run'->>'schema_version')::int, 1),
    p_payload->'_meta'->>'source_checksum',
    p_user_id
  )
  ON CONFLICT (project_id, run_id) DO UPDATE SET
    kind = EXCLUDED.kind,
    env = EXCLUDED.env,
    branch = EXCLUDED.branch,
    commit_sha = EXCLUDED.commit_sha,
    pipeline = EXCLUDED.pipeline,
    build_url = EXCLUDED.build_url,
    started_at = EXCLUDED.started_at,
    finished_at = EXCLUDED.finished_at,
    duration_ms = EXCLUDED.duration_ms,
    total = EXCLUDED.total,
    passed = EXCLUDED.passed,
    failed = EXCLUDED.failed,
    skipped = EXCLUDED.skipped,
    flaky = EXCLUDED.flaky,
    runners = EXCLUDED.runners,
    categories = EXCLUDED.categories,
    tests = EXCLUDED.tests,
    schema_version = EXCLUDED.schema_version,
    source_checksum = EXCLUDED.source_checksum,
    uploaded_by = EXCLUDED.uploaded_by,
    updated_at = now()
  RETURNING id INTO v_qa_run_id;

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'qa_run_id', v_qa_run_id
  );
END;
$$;

REVOKE ALL ON FUNCTION ingest_qa_run_core(jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION ingest_qa_run_core(jsonb, uuid) FROM anon;
REVOKE ALL ON FUNCTION ingest_qa_run_core(jsonb, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION ingest_qa_run_core(jsonb, uuid) FROM service_role;

-- ─── Authenticated wrapper (future UI upload path) ───────────────────────
CREATE OR REPLACE FUNCTION ingest_qa_run(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT has_qa_access() THEN
    RAISE EXCEPTION 'insufficient privileges: admin or operator role required';
  END IF;
  RETURN ingest_qa_run_core(p_payload, auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION ingest_qa_run(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION ingest_qa_run(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION ingest_qa_run(jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION ingest_qa_run(jsonb) TO authenticated;

-- ─── Service-role wrapper (API route path) ───────────────────────────────
-- Mirrors the security model of ingest_qa_report_service: explicit
-- auth.role() guard inside the body + explicit grant to service_role.
CREATE OR REPLACE FUNCTION ingest_qa_run_service(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'insufficient privileges: service role required';
  END IF;
  RETURN ingest_qa_run_core(p_payload, NULL);
END;
$$;

REVOKE ALL ON FUNCTION ingest_qa_run_service(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION ingest_qa_run_service(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION ingest_qa_run_service(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION ingest_qa_run_service(jsonb) TO service_role;
