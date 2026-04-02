import { describe, expect, it } from 'vitest'
import {
  normalizeAutomationQaPayload,
  qaAutomationPayloadSchema,
} from '../automation'

const validAutomationPayload = {
  project: 'Tilt',
  period: { from: '2026-03-25', to: '2026-04-01' },
  run_meta: {
    schema_version: 1,
    generated_at: '2026-04-01T02:00:00.000Z',
    branch: 'main',
    commit_sha: 'abcdef1234567890',
    build_url: 'https://ci.example.com/builds/123',
    pipeline: 'nightly',
  },
  snapshot: {
    framework: 'Playwright + TypeScript',
    ci: 'Bitbucket Pipelines',
    failures: 0,
    summary: {
      active_scope: 908,
      total_scope: 933,
      duplicates_deleted: 25,
      automated: 258,
      discovered_tests: 825,
      discovered_files: 57,
      discovered_static: 727,
      remaining: 650,
      remaining_planned: 512,
      remaining_blocked: 118,
    },
    automation_plan: {
      automated: 258,
      planned: 512,
      blocked: 118,
      manual: 20,
    },
    execution_groups: [
      { name: 'API', count: 556, files: 38, static: 558 },
    ],
    modules: [
      { key: 'shipments', name: 'Shipments', done: 24, left: 107 },
    ],
    fully_covered_sections: ['Carriers / Contacts'],
    heaviest_remaining: [
      { section: 'Shipments / General', done: 24, left: 107 },
    ],
    ci_cd: {
      pipelines: ['Nightly 02:00 UTC'],
      stack: 'GraphQLClient + POM',
      wip_note: 'WIP: 36 modified',
    },
  },
  activity: {
    recent_progress: {
      period_days: 7,
      items: [{ text: '12 new spec files', badge: '+12' }],
    },
    needs_attention: [{ text: '18 skipped tests', badge: 'dead code' }],
    recommended_next: ['Shipments / General - highest impact'],
  },
}

describe('qaAutomationPayloadSchema', () => {
  it('accepts a valid automation payload', () => {
    const result = qaAutomationPayloadSchema.safeParse(validAutomationPayload)
    expect(result.success).toBe(true)
  })

  it('rejects unknown keys in strict nested objects', () => {
    const result = qaAutomationPayloadSchema.safeParse({
      ...validAutomationPayload,
      snapshot: {
        ...validAutomationPayload.snapshot,
        unexpected: true,
      },
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid run_meta timestamps', () => {
    const result = qaAutomationPayloadSchema.safeParse({
      ...validAutomationPayload,
      run_meta: {
        ...validAutomationPayload.run_meta,
        generated_at: 'not-a-date',
      },
    })

    expect(result.success).toBe(false)
  })

  it('accepts payload without activity (optional)', () => {
    const { activity: _, ...withoutActivity } = validAutomationPayload
    const result = qaAutomationPayloadSchema.safeParse(withoutActivity)
    expect(result.success).toBe(true)
  })

  it('rejects invalid commit SHAs', () => {
    const result = qaAutomationPayloadSchema.safeParse({
      ...validAutomationPayload,
      run_meta: {
        ...validAutomationPayload.run_meta,
        commit_sha: 'xyz',
      },
    })

    expect(result.success).toBe(false)
  })
})

describe('normalizeAutomationQaPayload', () => {
  it('normalizes the automation payload into the shared ingest shape', () => {
    const normalized = normalizeAutomationQaPayload(validAutomationPayload, {
      sourceChecksum: 'sha256:test',
    })

    expect(normalized.project).toBe('Tilt')
    expect(normalized.framework).toBe('Playwright + TypeScript')
    expect(normalized.summary.automated).toBe(258)
    expect(normalized.recent_progress?.period_days).toBe(7)
    expect(normalized.needs_attention[0]?.text).toBe('18 skipped tests')
    expect(normalized.recommended_next[0]).toContain('Shipments')
    expect(normalized.run_meta?.pipeline).toBe('nightly')
    expect(normalized._meta?.schema_version).toBe(1)
    expect(normalized._meta?.source_checksum).toBe('sha256:test')
  })

  it('normalizes absent activity to empty defaults', () => {
    const { activity: _, ...withoutActivity } = validAutomationPayload
    const parsed = qaAutomationPayloadSchema.parse(withoutActivity)
    const normalized = normalizeAutomationQaPayload(parsed)

    expect(normalized.recent_progress).toBeUndefined()
    expect(normalized.needs_attention).toEqual([])
    expect(normalized.recommended_next).toEqual([])
  })

  it('uses the run_meta schema_version in normalized metadata', () => {
    const normalized = normalizeAutomationQaPayload({
      ...validAutomationPayload,
      run_meta: {
        ...validAutomationPayload.run_meta,
        schema_version: 2,
      },
    })

    expect(normalized._meta?.schema_version).toBe(2)
  })
})
