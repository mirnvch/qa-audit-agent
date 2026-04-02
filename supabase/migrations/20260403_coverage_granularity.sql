-- Add explicit coverage granularity field to qa_reports
-- 'section' (default for manual uploads) or 'module' (automation publisher)

ALTER TABLE qa_reports
  ADD COLUMN IF NOT EXISTS coverage_granularity text
  DEFAULT 'section'
  CHECK (coverage_granularity IN ('section', 'module'));

-- Update ingest core to persist coverage_granularity from payload
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
    coverage_granularity,
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
    COALESCE(p_payload->>'coverage_granularity', 'section'),
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
    coverage_granularity = EXCLUDED.coverage_granularity,
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

-- Update public read RPC to include coverage_granularity
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
  SELECT project_id, is_active, show_history, expires_at
  INTO v_access
  FROM qa_project_access
  WHERE code = p_code;

  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT v_access.is_active THEN RETURN NULL; END IF;
  IF v_access.expires_at IS NOT NULL AND v_access.expires_at < now() THEN RETURN NULL; END IF;

  SELECT name, slug INTO v_project
  FROM qa_projects WHERE id = v_access.project_id;

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
      'ci_cd', v_report.ci_cd,
      'coverage_granularity', COALESCE(v_report.coverage_granularity, 'section')
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
