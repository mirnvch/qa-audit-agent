import { z } from 'zod'

const moduleKeyRegex = /^[a-z0-9][a-z0-9_-]*$/

export function isValidCalendarDate(value: string): boolean {
  const date = new Date(value + 'T00:00:00Z')
  if (isNaN(date.getTime())) return false
  return date.toISOString().startsWith(value)
}

function isValidIsoDateTime(value: string): boolean {
  return !isNaN(Date.parse(value))
}

export const dateString = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD format')
  .refine(isValidCalendarDate, 'must be a valid calendar date')

export const isoDateTimeString = z.string()
  .refine(isValidIsoDateTime, 'must be a valid ISO date-time')

export const periodSchema = z.object({
  from: dateString,
  to: dateString,
}).refine((value) => value.to >= value.from, {
  message: 'period.to must be >= period.from',
})

export const summarySchema = z.object({
  active_scope: z.number().int().nonnegative(),
  total_scope: z.number().int().nonnegative(),
  duplicates_deleted: z.number().int().nonnegative().default(0),
  automated: z.number().int().nonnegative(),
  discovered_tests: z.number().int().nonnegative(),
  discovered_files: z.number().int().nonnegative(),
  discovered_static: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  remaining_planned: z.number().int().nonnegative(),
  remaining_blocked: z.number().int().nonnegative(),
})

export const automationPlanSchema = z.object({
  automated: z.number().int().nonnegative(),
  planned: z.number().int().nonnegative(),
  blocked: z.number().int().nonnegative(),
  manual: z.number().int().nonnegative(),
})

export const executionGroupSchema = z.object({
  name: z.string().min(1),
  count: z.number().int().nonnegative(),
  files: z.number().int().nonnegative().optional(),
  tagged_files: z.number().int().nonnegative().optional(),
  static: z.number().int().nonnegative().optional(),
  note: z.string().optional(),
})

export const moduleSchema = z.object({
  key: z.string().regex(moduleKeyRegex, 'module key must be lowercase alphanumeric with optional hyphens/underscores'),
  name: z.string().min(1),
  done: z.number().int().nonnegative(),
  left: z.number().int().nonnegative(),
})

export const heaviestRemainingSchema = z.object({
  section: z.string().min(1),
  done: z.number().int().nonnegative(),
  left: z.number().int().nonnegative(),
})

export const progressItemSchema = z.object({
  text: z.string().min(1),
  badge: z.string().optional(),
})

export const attentionItemSchema = z.object({
  text: z.string().min(1),
  badge: z.string().optional(),
})

export const recentProgressSchema = z.object({
  period_days: z.number().int().positive(),
  items: z.array(progressItemSchema),
})

export const ciCdSchema = z.object({
  pipelines: z.array(z.string()),
  stack: z.string().optional(),
  wip_note: z.string().optional(),
})

export const qaRunMetaSchema = z.object({
  schema_version: z.number().int().positive().default(1),
  generated_at: isoDateTimeString,
  branch: z.string().min(1),
  commit_sha: z.string().regex(/^[0-9a-f]{7,64}$/i, 'must look like a git commit SHA'),
  build_url: z.string().url().optional(),
  pipeline: z.string().min(1),
}).strict()

export const qaIngestMetaSchema = z.object({
  schema_version: z.number().int().positive().optional(),
  source_filename: z.string().min(1).optional(),
  source_checksum: z.string().min(1).optional(),
}).strict()

export const qaReportPayloadSchema = z.object({
  project: z.string().min(1),
  framework: z.string().optional(),
  ci: z.string().optional(),
  period: periodSchema,
  summary: summarySchema,
  automation_plan: automationPlanSchema,
  execution_groups: z.array(executionGroupSchema).default([]),
  modules: z.array(moduleSchema).default([]),
  fully_covered_sections: z.array(z.string()).default([]),
  heaviest_remaining: z.array(heaviestRemainingSchema).default([]),
  recent_progress: recentProgressSchema.optional(),
  needs_attention: z.array(attentionItemSchema).default([]),
  recommended_next: z.array(z.string()).default([]),
  ci_cd: ciCdSchema.optional(),
  failures: z.number().int().nonnegative().default(0),
  coverage_granularity: z.enum(['section', 'module']).default('section'),
})

export const qaIngestPayloadSchema = qaReportPayloadSchema.extend({
  run_meta: qaRunMetaSchema.optional(),
  _meta: qaIngestMetaSchema.optional(),
})

export type QaReportPayload = z.infer<typeof qaReportPayloadSchema>
export type QaIngestPayload = z.infer<typeof qaIngestPayloadSchema>

export type ExecutionGroup = z.infer<typeof executionGroupSchema>
export type RecentProgress = z.infer<typeof recentProgressSchema>
export type AttentionItem = z.infer<typeof attentionItemSchema>
export type CiCd = z.infer<typeof ciCdSchema>
export type RunMeta = z.infer<typeof qaRunMetaSchema>
export type QaIngestMeta = z.infer<typeof qaIngestMetaSchema>

export type CoverageGranularity = 'section' | 'module'

export type QaProject = {
  id: string
  name: string
  normalized_name: string
  slug: string
  created_at: string
  updated_at: string
}

export type QaReport = {
  id: string
  project_id: string
  period_from: string
  period_to: string
  framework: string | null
  ci: string | null
  failures: number
  active_scope: number
  total_scope: number
  duplicates_deleted: number
  automated: number
  discovered_tests: number
  discovered_files: number
  discovered_static: number
  remaining: number
  remaining_planned: number
  remaining_blocked: number
  plan_automated: number
  plan_planned: number
  plan_blocked: number
  plan_manual: number
  execution_groups: ExecutionGroup[]
  recent_progress: RecentProgress | null
  needs_attention: AttentionItem[]
  recommended_next: string[]
  ci_cd: CiCd | null
  schema_version: number
  source_filename: string | null
  source_checksum: string | null
  uploaded_by: string | null
  run_meta: RunMeta | null
  coverage_granularity: CoverageGranularity
  created_at: string
  updated_at: string
}

export type QaReportModule = {
  id: string
  report_id: string
  module_key: string
  name: string
  done: number
  left: number
  sort_order: number
}

export type QaReportSection = {
  id: string
  report_id: string
  section: string
  type: 'covered' | 'remaining'
  done: number | null
  left: number | null
  sort_order: number
}

export type QaProjectAccess = {
  id: string
  project_id: string
  code: string
  is_active: boolean
  show_history: boolean
  expires_at: string | null
  created_at: string
}

export type QaReportHistoryItem = {
  id: string
  period_from: string
  period_to: string
  automated: number
  active_scope: number
}

export type QaReportViewProps = {
  project: { name: string }
  report: QaReport
  modules: QaReportModule[]
  coveredSections: string[]
  remainingSections: { section: string; done: number; left: number }[]
  history?: QaReportHistoryItem[]
  showHistory?: boolean
  coverageGranularity?: CoverageGranularity
}
