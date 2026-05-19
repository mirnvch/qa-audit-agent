import { describe, it, expect } from 'vitest'
import { qaRunIngestPayloadSchema } from '../run-schema'
import sampleQaRun from './fixtures/sample-qa-run.json'

describe('qaRunIngestPayloadSchema', () => {
  it('accepts the canonical sample qa-run fixture', () => {
    const result = qaRunIngestPayloadSchema.safeParse(sampleQaRun)
    if (!result.success) {
      console.error(result.error.format())
    }
    expect(result.success).toBe(true)
  })

  it('rejects unknown top-level keys (strict)', () => {
    const bad = { ...sampleQaRun, extra_field: 'nope' }
    expect(qaRunIngestPayloadSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects a commit_sha that does not look like a git sha', () => {
    const bad = { ...sampleQaRun, run: { ...sampleQaRun.run, commit_sha: 'not-a-sha' } }
    expect(qaRunIngestPayloadSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects an invalid kind', () => {
    const bad = { ...sampleQaRun, run: { ...sampleQaRun.run, kind: 'whenever' } }
    expect(qaRunIngestPayloadSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects finished_at < started_at', () => {
    const bad = {
      ...sampleQaRun,
      run: {
        ...sampleQaRun.run,
        started_at: '2026-05-19T06:38:00.000Z',
        finished_at: '2026-05-19T06:30:00.000Z',
      },
    }
    expect(qaRunIngestPayloadSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects totals where passed+failed+skipped exceed total', () => {
    const bad = {
      ...sampleQaRun,
      totals: { total: 10, passed: 8, failed: 5, skipped: 0, flaky: 0 },
    }
    expect(qaRunIngestPayloadSchema.safeParse(bad).success).toBe(false)
  })

  it('rejects test status outside enum', () => {
    const bad = {
      ...sampleQaRun,
      tests: [{ ...sampleQaRun.tests[0], status: 'unknown' }, ...sampleQaRun.tests.slice(1)],
    }
    expect(qaRunIngestPayloadSchema.safeParse(bad).success).toBe(false)
  })

  it('defaults flaky to 0 when omitted', () => {
    const noFlaky = {
      ...sampleQaRun,
      totals: {
        total: sampleQaRun.totals.total,
        passed: sampleQaRun.totals.passed,
        failed: sampleQaRun.totals.failed,
        skipped: sampleQaRun.totals.skipped,
      },
    }
    const result = qaRunIngestPayloadSchema.safeParse(noFlaky)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.totals.flaky).toBe(0)
  })

  it('rejects a runner whose per-runner sum exceeds runner.total', () => {
    const bad = {
      ...sampleQaRun,
      runners: [
        // playwright entry inflated so passed+failed+skipped > total
        { name: 'playwright', total: 10, passed: 9, failed: 5, skipped: 0, flaky: 0, duration_ms: 1000 },
        sampleQaRun.runners[1],
      ],
    }
    const result = qaRunIngestPayloadSchema.safeParse(bad)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.errors.map((e) => e.message).join(' | ')
      expect(msg).toMatch(/playwright.*runner\.total/)
    }
  })

  it('rejects a category whose per-category sum exceeds category.total', () => {
    const bad = {
      ...sampleQaRun,
      categories: [
        // shipments entry inflated so passed+failed+skipped > total
        ...sampleQaRun.categories.slice(0, 2),
        { id: 'shipments', label: 'Shipments', total: 9, passed: 8, failed: 5, skipped: 0 },
        ...sampleQaRun.categories.slice(3),
      ],
    }
    const result = qaRunIngestPayloadSchema.safeParse(bad)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.errors.map((e) => e.message).join(' | ')
      expect(msg).toMatch(/shipments.*category\.total/)
    }
  })
})
