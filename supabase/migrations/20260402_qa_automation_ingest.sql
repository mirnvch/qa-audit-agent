-- QA Reports automation ingest groundwork
-- Adds run metadata storage and a service-role ingestion wrapper that reuses
-- the same SQL ingest core as the authenticated admin flow.

ALTER TABLE qa_reports
  ADD COLUMN IF NOT EXISTS run_meta jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'qa_reports_run_meta_object_check'
  ) THEN
    ALTER TABLE qa_reports
      ADD CONSTRAINT qa_reports_run_meta_object_check
      CHECK (run_meta IS NULL OR jsonb_typeof(run_meta) = 'object');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION ingest_qa_report_core(
  p_payload jsonb,
  p_uploaded_by uuid DEFAULT NULL
)
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
  v_normalized := regexp_replace(lower(p_payload->>'project'), '[^a-z0-9]', '', 'g');
  IF v_normalized = '' THEN
    RAISE EXCEPTION 'project name normalizes to empty string';
  END IF;

  INSERT INTO qa_projects (name, normalized_name, slug)
  VALUES (p_payload->>'project', v_normalized, v_normalized)
  ON CONFLICT (normalized_name) DO NOTHING
  RETURNING id INTO v_project_id;

  IF v_project_id IS NULL THEN
    SELECT id INTO STRICT v_project_id
    FROM qa_projects
    WHERE normalized_name = v_normalized;
  ELSE
    INSERT INTO qa_project_access (project_id, code, is_active, show_history)
    VALUES (
      v_project_id,
      rtrim(translate(encode(extensions.gen_random_bytes(16), 'base64'), '+/=', '-_'), '='),
      true,
      true
    );
  END IF;

  INSERT INTO qa_reports (
    project_id, period_from, period_to,
    framework, ci, failures,
    active_scope, total_scope, duplicates_deleted,
    automated, discovered_tests, discovered_files, discovered_static,
    remaining, remaining_planned, remaining_blocked,
    plan_automated, plan_planned, plan_blocked, plan_manual,
    execution_groups, recent_progress, needs_attention, recommended_next, ci_cd,
    schema_version, source_filename, source_checksum, uploaded_by, run_meta,
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
    COALESCE((p_payload->'_meta'->>'schema_version')::int, (p_payload->'run_meta'->>'schema_version')::int, 1),
    p_payload->'_meta'->>'source_filename',
    p_payload->'_meta'->>'source_checksum',
    p_uploaded_by,
    CASE
      WHEN jsonb_typeof(p_payload->'run_meta') = 'object' THEN p_payload->'run_meta'
      ELSE NULL
    END,
    v_now,
    v_now
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
    run_meta = EXCLUDED.run_meta,
    updated_at = v_now
  RETURNING id INTO v_report_id;

  DELETE FROM qa_report_modules WHERE report_id = v_report_id;
  DELETE FROM qa_report_sections WHERE report_id = v_report_id;

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

  RETURN jsonb_build_object(
    'project_id', v_project_id,
    'report_id', v_report_id
  );
END;
$$;

REVOKE ALL ON FUNCTION ingest_qa_report_core(jsonb, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION ingest_qa_report_core(jsonb, uuid) FROM anon;
REVOKE ALL ON FUNCTION ingest_qa_report_core(jsonb, uuid) FROM authenticated;
REVOKE ALL ON FUNCTION ingest_qa_report_core(jsonb, uuid) FROM service_role;

CREATE OR REPLACE FUNCTION ingest_qa_report(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_qa_access() THEN
    RAISE EXCEPTION 'insufficient privileges: admin or operator role required';
  END IF;

  RETURN ingest_qa_report_core(p_payload, auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION ingest_qa_report(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION ingest_qa_report(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION ingest_qa_report(jsonb) FROM service_role;
GRANT EXECUTE ON FUNCTION ingest_qa_report(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION ingest_qa_report_service(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'insufficient privileges: service role required';
  END IF;

  RETURN ingest_qa_report_core(p_payload, NULL);
END;
$$;

REVOKE ALL ON FUNCTION ingest_qa_report_service(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION ingest_qa_report_service(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION ingest_qa_report_service(jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION ingest_qa_report_service(jsonb) TO service_role;
