import { describe, it, expect } from 'vitest'
import { qaReportPayloadSchema } from '../schema'

const validPayload = {
  project: 'Tilt',
  framework: 'Playwright + TypeScript',
  ci: 'Bitbucket Pipelines',
  period: { from: '2024-08-01', to: '2026-04-01' },
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
    { name: 'SMOKE', count: 54, tagged_files: 18, note: 'cross-cutting tag' },
    { name: 'FUNCTIONAL', count: 212, files: 8, static: 112 },
  ],
  modules: [
    { key: 'carriers', name: 'Carriers', done: 66, left: 34 },
    { key: 'clients', name: 'Clients', done: 44, left: 32 },
  ],
  fully_covered_sections: ['Carriers / Contacts', 'Carriers / Drivers'],
  heaviest_remaining: [
    { section: 'Shipments / General', done: 24, left: 107 },
  ],
  recent_progress: {
    period_days: 14,
    items: [
      { text: '12 new spec files', badge: '+12' },
      { text: '19 existing files modified' },
    ],
  },
  needs_attention: [
    { text: '18 skipped tests', badge: 'dead code' },
  ],
  recommended_next: ['Shipments/General - highest impact'],
  ci_cd: {
    pipelines: ['Bitbucket Pipelines', 'Nightly 02:00 UTC'],
    stack: 'GraphQLClient + POM',
    wip_note: 'WIP: 36 modified',
  },
  failures: 0,
}

describe('qaReportPayloadSchema', () => {
  it('accepts a valid full payload', () => {
    const result = qaReportPayloadSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('accepts minimal payload (only required fields)', () => {
    const minimal = {
      project: 'Test',
      period: { from: '2026-01-01', to: '2026-01-31' },
      summary: {
        active_scope: 100,
        total_scope: 100,
        automated: 50,
        discovered_tests: 80,
        discovered_files: 10,
        discovered_static: 70,
        remaining: 50,
        remaining_planned: 30,
        remaining_blocked: 20,
      },
      automation_plan: {
        automated: 50,
        planned: 30,
        blocked: 20,
        manual: 0,
      },
    }
    const result = qaReportPayloadSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })

  it('accepts empty arrays for optional array fields', () => {
    const payload = {
      ...validPayload,
      execution_groups: [],
      modules: [],
      fully_covered_sections: [],
      heaviest_remaining: [],
      needs_attention: [],
      recommended_next: [],
    }
    const result = qaReportPayloadSchema.safeParse(payload)
    expect(result.success).toBe(true)
  })

  it('rejects missing project name', () => {
    const { project: _, ...rest } = validPayload
    const result = qaReportPayloadSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty project name', () => {
    const result = qaReportPayloadSchema.safeParse({ ...validPayload, project: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing period', () => {
    const { period: _, ...rest } = validPayload
    const result = qaReportPayloadSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects period.to < period.from', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      period: { from: '2026-04-01', to: '2024-01-01' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format in period', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      period: { from: 'Jan 1 2026', to: '2026-01-31' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects impossible month (2026-13-99)', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      period: { from: '2026-13-99', to: '2026-13-99' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects impossible day (2026-02-30)', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      period: { from: '2026-02-30', to: '2026-03-01' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects Feb 29 on non-leap year (2025-02-29)', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      period: { from: '2025-02-29', to: '2025-03-01' },
    })
    expect(result.success).toBe(false)
  })

  it('accepts Feb 29 on leap year (2024-02-29)', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      period: { from: '2024-02-29', to: '2026-04-01' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing summary fields', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      summary: { active_scope: 100 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative numbers in summary', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      summary: { ...validPayload.summary, active_scope: -1 },
    })
    expect(result.success).toBe(false)
  })

  it('rejects string where int expected', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      summary: { ...validPayload.summary, active_scope: 'one hundred' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid module_key format (uppercase)', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      modules: [{ key: 'Carriers', name: 'Carriers', done: 66, left: 34 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid module_key format (spaces)', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      modules: [{ key: 'my module', name: 'My Module', done: 10, left: 5 }],
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid module_key with hyphens and underscores', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      modules: [{ key: 'my-module_v2', name: 'My Module', done: 10, left: 5 }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative failures', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      failures: -1,
    })
    expect(result.success).toBe(false)
  })

  it('defaults failures to 0 when omitted', () => {
    const { failures: _, ...rest } = validPayload
    const result = qaReportPayloadSchema.safeParse(rest)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.failures).toBe(0)
    }
  })

  it('rejects non-integer numbers', () => {
    const result = qaReportPayloadSchema.safeParse({
      ...validPayload,
      summary: { ...validPayload.summary, active_scope: 100.5 },
    })
    expect(result.success).toBe(false)
  })
})
