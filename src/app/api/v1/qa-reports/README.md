# QA Reports API

## POST /api/v1/qa-reports

Ingest a QA automation snapshot from CI/CD pipelines.

### Auth

Bearer token via API key stored in `api_keys`:

```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

### Request

```json
{
  "project": "Tilt",
  "period": { "from": "2026-03-25", "to": "2026-04-01" },
  "run_meta": {
    "schema_version": 1,
    "generated_at": "2026-04-01T02:00:00.000Z",
    "branch": "main",
    "commit_sha": "abcdef1234567890",
    "build_url": "https://ci.example.com/builds/123",
    "pipeline": "nightly"
  },
  "snapshot": {
    "framework": "Playwright + TypeScript",
    "ci": "Bitbucket Pipelines",
    "failures": 0,
    "summary": {
      "active_scope": 908,
      "total_scope": 933,
      "duplicates_deleted": 25,
      "automated": 258,
      "discovered_tests": 825,
      "discovered_files": 57,
      "discovered_static": 727,
      "remaining": 650,
      "remaining_planned": 512,
      "remaining_blocked": 118
    },
    "automation_plan": {
      "automated": 258,
      "planned": 512,
      "blocked": 118,
      "manual": 20
    },
    "execution_groups": [
      { "name": "API", "count": 556, "files": 38, "static": 558 }
    ],
    "modules": [
      { "key": "shipments", "name": "Shipments", "done": 24, "left": 107 }
    ],
    "fully_covered_sections": ["Carriers / Contacts"],
    "heaviest_remaining": [
      { "section": "Shipments / General", "done": 24, "left": 107 }
    ],
    "ci_cd": {
      "pipelines": ["Nightly 02:00 UTC"],
      "stack": "GraphQLClient + POM",
      "wip_note": "WIP: 36 modified"
    }
  },
  "activity": {
    "recent_progress": {
      "period_days": 7,
      "items": [{ "text": "12 new spec files", "badge": "+12" }]
    },
    "needs_attention": [{ "text": "18 skipped tests", "badge": "dead code" }],
    "recommended_next": ["Shipments / General - highest impact"]
  }
}
```

### Fields

- `project` — required. Display name, normalized for dedup.
- `period` — required. `from`/`to` as `YYYY-MM-DD`.
- `run_meta` — required. CI/CD run metadata (branch, commit, build URL, pipeline).
- `snapshot` — required. Test data snapshot matching the QA report schema.
- `activity` — **optional**. Defaults to empty progress/attention/recommendations.

### Response (200)

```json
{
  "project_id": "uuid",
  "report_id": "uuid",
  "checksum": "sha256:..."
}
```

### Errors

| Status | Meaning |
|--------|---------|
| 400 | Invalid JSON, empty body, or schema validation failure |
| 401 | Invalid API key |
| 413 | Payload exceeds 512 KB |
| 415 | `Content-Type` is not `application/json` |
| 500 | Ingest RPC failure |

### Notes

- Validates the nested automation payload, normalizes into the shared `qa_reports` ingest shape, and ingests atomically.
- Same `(normalized project, period.from, period.to)` replaces the existing snapshot (upsert).
- `run_meta` is stored on `qa_reports.run_meta` for auditability.
- Server computes and stores a SHA-256 checksum of the request body.
- Quality gate thresholds: <10% coverage = red, <25% = yellow, regression in automated count = red.
