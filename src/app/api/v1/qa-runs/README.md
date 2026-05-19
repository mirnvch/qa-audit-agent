# QA Runs API

## POST /api/v1/qa-runs

Ingest a per-execution test-run report (daily / nightly / ad-hoc) from a CI
pipeline. Distinct from `/api/v1/qa-reports`, which holds coverage snapshots.

### Auth

Bearer token via API key stored in `api_keys` (same scheme as qa-reports):

```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

### Request

```json
{
  "project": "Nexus",
  "run": {
    "schema_version": 1,
    "run_id": "nexus-2026-05-19-daily-2049",
    "kind": "daily",
    "env": "dev",
    "branch": "main",
    "commit_sha": "ea81c4e76126ed3912ecdb72fd68aad6cf59c0ec",
    "pipeline": "custom:daily-tests",
    "build_url": "https://bitbucket.org/tiltgroup/nexus-automation-tests/pipelines/results/2049",
    "started_at": "2026-05-19T06:30:01.000Z",
    "finished_at": "2026-05-19T06:38:45.000Z",
    "duration_ms": 524000
  },
  "totals": { "total": 48, "passed": 47, "failed": 1, "skipped": 0, "flaky": 0 },
  "runners": [
    { "name": "playwright", "total": 34, "passed": 33, "failed": 1, "skipped": 0, "flaky": 0, "duration_ms": 425000 },
    { "name": "vitest",     "total": 14, "passed": 14, "failed": 0, "skipped": 0, "flaky": 0, "duration_ms": 75000 }
  ],
  "categories": [
    { "id": "shipments", "label": "Shipments", "total": 9, "passed": 8, "failed": 1, "skipped": 0 }
  ],
  "tests": [
    {
      "file": "spec/api/functional/shipments/shipments-hazmat.api.spec.ts",
      "title": "@daily [API-C641] Create shipment with hazardous materials",
      "category_id": "shipments",
      "sub_area": "hazmat",
      "testrail_ids": ["C641"],
      "status": "failed",
      "duration_ms": 30012,
      "failure_messages": ["TimeoutError: createLoad mutation did not resolve within 30s"]
    }
  ]
}
```

### Fields

- `project` — required. Display name. Server auto-creates `qa_projects` row by
  normalized name (lowercase alphanumeric), mirroring the qa-reports behavior.
- `run.run_id` — required. Producer-supplied identifier. Unique per project.
  Re-posting with the same `(project, run_id)` upserts the row (idempotent).
- `run.kind` — `daily | nightly | ad-hoc`.
- `run.env` — environment label (`dev`, `stg`, etc.). Free text, max 32 chars.
- `run.commit_sha` — 7–64 hex chars (validated server-side).
- `run.{started_at, finished_at}` — ISO datetime strings. `finished_at >= started_at`.
- `totals` — aggregate counts. `passed + failed + skipped <= total`.
- `runners[]` — one entry per test runner (Playwright / Vitest / etc.).
- `categories[]` — domain breakdown (Carriers / Clients / Shipments / etc.).
- `tests[]` — per-test rows (file, title, category, status, duration, failure messages).

### Response (200)

```json
{
  "project_id": "uuid",
  "qa_run_id": "uuid",
  "checksum": "sha256:..."
}
```

The `qa_run_id` is the row's DB UUID — use this in admin URLs
(`/qa-reports/runs/<qa_run_id>`), not the producer-supplied `run_id`.

### Errors

| Status | Meaning |
|--------|---------|
| 400 | Invalid JSON, empty body, schema validation failure (`totals.* sum > total`, bad `commit_sha`, etc.), or business-rule violation (`finished_at < started_at`) |
| 401 | Invalid API key |
| 413 | Payload exceeds 512 KB |
| 415 | `Content-Type` is not `application/json` |
| 500 | Ingest RPC failure |

### Notes

- Strict schema (`.strict()`); unknown top-level keys are rejected to keep
  the producer/consumer contract honest.
- Same `(project, run_id)` replaces the existing row (upsert).
- Server computes a SHA-256 checksum of the raw body and stores it on
  `qa_runs.source_checksum` for auditability.
- The schema does NOT include any "product impact" / "Jira finding" prose. v1
  intentionally stores only objective test-run data; product-narrative cards
  require a curated findings layer that does not exist in Nexus yet.
- DB write path uses the `ingest_qa_run_service` RPC (service-role only).
  Authenticated UI uploads (future) should use `ingest_qa_run` instead.
