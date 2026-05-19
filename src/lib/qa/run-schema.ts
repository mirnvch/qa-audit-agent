import { z } from 'zod'
import { isoDateTimeString } from './schema'

/**
 * QA Runs — per-execution test-run report ingest schema.
 *
 * Distinct from the qa_reports (coverage-snapshot) schema. A qa_run is one
 * pipeline-execution worth of test results (typically a daily, nightly, or
 * ad-hoc CI run) and stores per-test status, per-runner / per-category
 * aggregates, and run metadata. Mirrors the PC integrity-report Test Results
 * data model — see PC scripts/render-test-results.ts for the inspiration.
 */

const runIdRegex = /^[A-Za-z0-9._\-:/]+$/
const commitShaRegex = /^[0-9a-f]{7,64}$/i

export const qaRunKindEnum = z.enum(['daily', 'nightly', 'ad-hoc'])
export type QaRunKind = z.infer<typeof qaRunKindEnum>

export const qaRunStatusEnum = z.enum(['passed', 'failed', 'skipped', 'pending', 'todo', 'flaky'])
export type QaRunTestStatus = z.infer<typeof qaRunStatusEnum>

export const qaRunMetaSchema = z
  .object({
    schema_version: z.number().int().positive().default(1),
    run_id: z.string().min(1).max(200).regex(runIdRegex, 'run_id must be ASCII safe text'),
    kind: qaRunKindEnum,
    env: z.string().min(1).max(32),
    branch: z.string().min(1),
    commit_sha: z.string().regex(commitShaRegex, 'must look like a git commit SHA'),
    pipeline: z.string().min(1),
    build_url: z.string().url().optional(),
    started_at: isoDateTimeString,
    finished_at: isoDateTimeString,
    duration_ms: z.number().int().nonnegative(),
  })
  .strict()
  .refine((v) => Date.parse(v.finished_at) >= Date.parse(v.started_at), {
    message: 'finished_at must be >= started_at',
    path: ['finished_at'],
  })

export const qaRunTotalsSchema = z
  .object({
    total: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    flaky: z.number().int().nonnegative().default(0),
  })
  .strict()

export const qaRunRunnerSchema = z
  .object({
    name: z.string().min(1),
    total: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    flaky: z.number().int().nonnegative().default(0),
    duration_ms: z.number().int().nonnegative().optional(),
  })
  .strict()

export const qaRunCategorySchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9_-]*$/, 'category id must be lowercase kebab/snake'),
    label: z.string().min(1),
    total: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  })
  .strict()

export const qaRunTestSchema = z
  .object({
    file: z.string().min(1),
    title: z.string().min(1),
    category_id: z.string().regex(/^[a-z][a-z0-9_-]*$/),
    sub_area: z.string().nullable().optional(),
    testrail_ids: z.array(z.string().regex(/^C\d+$/)).default([]),
    status: qaRunStatusEnum,
    duration_ms: z.number().int().nonnegative().nullable().optional(),
    failure_messages: z.array(z.string()).default([]),
  })
  .strict()

export const qaRunIngestPayloadSchema = z
  .object({
    project: z.string().min(1),
    run: qaRunMetaSchema,
    totals: qaRunTotalsSchema,
    runners: z.array(qaRunRunnerSchema).default([]),
    categories: z.array(qaRunCategorySchema).default([]),
    tests: z.array(qaRunTestSchema).default([]),
    _meta: z
      .object({
        source_checksum: z.string().min(1).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((payload, ctx) => {
    const t = payload.totals
    if (t.passed + t.failed + t.skipped > t.total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'totals.passed + failed + skipped must not exceed totals.total',
        path: ['totals'],
      })
    }
    const runnerSum = payload.runners.reduce(
      (acc, r) => acc + r.passed + r.failed + r.skipped,
      0,
    )
    if (payload.runners.length > 0 && runnerSum > t.total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'sum of runner pass/fail/skip must not exceed totals.total',
        path: ['runners'],
      })
    }
    // Per-runner: individual pass/fail/skip sum must fit within runner.total
    payload.runners.forEach((r, i) => {
      if (r.passed + r.failed + r.skipped > r.total) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `runner '${r.name}' passed + failed + skipped must not exceed runner.total`,
          path: ['runners', i],
        })
      }
    })
    // Per-category: individual pass/fail/skip sum must fit within category.total
    payload.categories.forEach((c, i) => {
      if (c.passed + c.failed + c.skipped > c.total) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `category '${c.id}' passed + failed + skipped must not exceed category.total`,
          path: ['categories', i],
        })
      }
    })
  })

export type QaRunIngestPayload = z.infer<typeof qaRunIngestPayloadSchema>
export type QaRunMeta = z.infer<typeof qaRunMetaSchema>
export type QaRunTotals = z.infer<typeof qaRunTotalsSchema>
export type QaRunRunner = z.infer<typeof qaRunRunnerSchema>
export type QaRunCategory = z.infer<typeof qaRunCategorySchema>
export type QaRunTest = z.infer<typeof qaRunTestSchema>

/**
 * Database row shape — mirrors the qa_runs table column set + jsonb
 * payloads typed by the ingest schema.
 */
export type QaRunRow = {
  id: string
  project_id: string
  run_id: string
  kind: QaRunKind
  env: string
  branch: string
  commit_sha: string
  pipeline: string
  build_url: string | null
  started_at: string
  finished_at: string
  duration_ms: number
  total: number
  passed: number
  failed: number
  skipped: number
  flaky: number
  runners: QaRunRunner[]
  categories: QaRunCategory[]
  tests: QaRunTest[]
  schema_version: number
  source_checksum: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

/** List-view projection — small subset for the runs index page. */
export type QaRunListItem = {
  id: string
  project_id: string
  run_id: string
  kind: QaRunKind
  env: string
  branch: string
  commit_sha: string
  pipeline: string
  build_url: string | null
  started_at: string
  finished_at: string
  duration_ms: number
  total: number
  passed: number
  failed: number
  skipped: number
  flaky: number
  project_name: string
}
