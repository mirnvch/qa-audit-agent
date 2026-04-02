import { z } from 'zod'
import {
  attentionItemSchema,
  ciCdSchema,
  executionGroupSchema,
  heaviestRemainingSchema,
  moduleSchema,
  periodSchema,
  qaIngestPayloadSchema,
  qaRunMetaSchema,
  recentProgressSchema,
  summarySchema,
  automationPlanSchema,
  type QaIngestPayload,
} from './schema'

export const qaAutomationSnapshotSchema = z.object({
  framework: z.string().min(1).optional(),
  ci: z.string().min(1).optional(),
  failures: z.number().int().nonnegative().default(0),
  summary: summarySchema,
  automation_plan: automationPlanSchema,
  execution_groups: z.array(executionGroupSchema).default([]),
  modules: z.array(moduleSchema).default([]),
  fully_covered_sections: z.array(z.string().min(1)).default([]),
  heaviest_remaining: z.array(heaviestRemainingSchema).default([]),
  ci_cd: ciCdSchema.optional(),
  coverage_granularity: z.enum(['section', 'module']).optional(),
}).strict()

export const qaAutomationActivitySchema = z.object({
  recent_progress: recentProgressSchema.optional(),
  needs_attention: z.array(attentionItemSchema).default([]),
  recommended_next: z.array(z.string().min(1)).default([]),
}).strict()

export const qaAutomationPayloadSchema = z.object({
  project: z.string().min(1),
  period: periodSchema,
  run_meta: qaRunMetaSchema,
  snapshot: qaAutomationSnapshotSchema,
  activity: qaAutomationActivitySchema.optional(),
}).strict()

export type QaAutomationPayload = z.infer<typeof qaAutomationPayloadSchema>

export function normalizeAutomationQaPayload(
  payload: QaAutomationPayload,
  options?: {
    sourceChecksum?: string
  }
): QaIngestPayload {
  const normalized: QaIngestPayload = {
    project: payload.project,
    framework: payload.snapshot.framework,
    ci: payload.snapshot.ci,
    period: payload.period,
    summary: payload.snapshot.summary,
    automation_plan: payload.snapshot.automation_plan,
    execution_groups: payload.snapshot.execution_groups,
    modules: payload.snapshot.modules,
    fully_covered_sections: payload.snapshot.fully_covered_sections,
    heaviest_remaining: payload.snapshot.heaviest_remaining,
    recent_progress: payload.activity?.recent_progress,
    needs_attention: payload.activity?.needs_attention ?? [],
    recommended_next: payload.activity?.recommended_next ?? [],
    ci_cd: payload.snapshot.ci_cd,
    failures: payload.snapshot.failures,
    coverage_granularity: payload.snapshot.coverage_granularity ?? 'section',
    run_meta: payload.run_meta,
    _meta: {
      schema_version: payload.run_meta.schema_version,
      ...(options?.sourceChecksum ? { source_checksum: options.sourceChecksum } : {}),
    },
  }

  return qaIngestPayloadSchema.parse(normalized)
}
