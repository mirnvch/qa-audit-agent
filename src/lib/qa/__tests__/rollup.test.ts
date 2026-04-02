import { describe, expect, it } from 'vitest'
import { computeQaProjectRollup, type QaRollupHistoryPoint } from '../rollup'

function point(overrides: Partial<QaRollupHistoryPoint> & { id: string; period_to: string }): QaRollupHistoryPoint {
  return {
    period_from: overrides.period_to,
    automated: 100,
    active_scope: 500,
    remaining: 400,
    failures: 0,
    covered_sections: [],
    ...overrides,
  }
}

describe('computeQaProjectRollup', () => {
  it('computes deltas, new coverage, and a green gate for improving history', () => {
    const result = computeQaProjectRollup([
      point({ id: 'r1', period_to: '2026-03-25', automated: 100, active_scope: 600, remaining: 500, covered_sections: ['Clients / Overview'] }),
      point({ id: 'r2', period_to: '2026-03-29', automated: 120, active_scope: 600, remaining: 470, covered_sections: ['Clients / Overview', 'Carriers / Contacts'] }),
      point({ id: 'r3', period_to: '2026-04-01', automated: 200, active_scope: 600, remaining: 430, covered_sections: ['Clients / Overview', 'Carriers / Contacts', 'Shipments / General'] }),
    ])

    expect(result.latestReport?.id).toBe('r3')
    expect(result.automatedDeltaPrevious).toBe(80)
    expect(result.automatedDeltaLast7Days).toBe(100)
    expect(result.remainingDeltaPrevious).toBe(-40)
    expect(result.remainingDeltaLast7Days).toBe(-70)
    expect(result.newlyCoveredSections).toEqual(['Shipments / General'])
    expect(result.qualityGate.status).toBe('green')
  })

  it('returns a red gate when failures are present or progress regresses', () => {
    const result = computeQaProjectRollup([
      point({ id: 'r1', period_to: '2026-03-30', automated: 150, active_scope: 500, remaining: 400, covered_sections: ['A'] }),
      point({ id: 'r2', period_to: '2026-04-01', automated: 145, active_scope: 500, remaining: 410, failures: 2, covered_sections: ['A'] }),
    ])

    expect(result.qualityGate.status).toBe('red')
    expect(result.qualityGate.reasons.join(' | ')).toContain('Latest report has 2 failures')
    expect(result.qualityGate.reasons.join(' | ')).toContain('Automated count dropped by 5')
    expect(result.qualityGate.reasons.join(' | ')).toContain('Remaining count increased by 10')
  })

  it('returns a yellow gate when there is no previous baseline', () => {
    const result = computeQaProjectRollup([
      point({ id: 'r1', period_to: '2026-04-01', automated: 200, active_scope: 500, remaining: 300 }),
    ])

    expect(result.latestReport?.id).toBe('r1')
    expect(result.automatedDeltaPrevious).toBeNull()
    expect(result.remainingDeltaPrevious).toBeNull()
    expect(result.qualityGate.status).toBe('yellow')
    expect(result.qualityGate.reasons).toContain('No previous report to compare against yet')
  })

  it('returns red for coverage below 10%', () => {
    const result = computeQaProjectRollup([
      point({ id: 'r1', period_to: '2026-04-01', automated: 5, active_scope: 500, remaining: 495 }),
    ])

    expect(result.qualityGate.status).toBe('red')
    expect(result.qualityGate.reasons[0]).toMatch(/Coverage below 10%/)
  })

  it('returns yellow for coverage between 10-25%', () => {
    const result = computeQaProjectRollup([
      point({ id: 'r1', period_to: '2026-03-30', automated: 50, active_scope: 500, remaining: 450 }),
      point({ id: 'r2', period_to: '2026-04-01', automated: 60, active_scope: 500, remaining: 440 }),
    ])

    expect(result.qualityGate.status).toBe('yellow')
    expect(result.qualityGate.reasons[0]).toMatch(/Coverage below 25%/)
  })

  it('returns green for coverage above 25% with progress', () => {
    const result = computeQaProjectRollup([
      point({ id: 'r1', period_to: '2026-03-30', automated: 130, active_scope: 500, remaining: 370 }),
      point({ id: 'r2', period_to: '2026-04-01', automated: 140, active_scope: 500, remaining: 360 }),
    ])

    expect(result.qualityGate.status).toBe('green')
  })

  it('returns yellow for zero progress between reports', () => {
    const result = computeQaProjectRollup([
      point({ id: 'r1', period_to: '2026-03-30', automated: 200, active_scope: 500, remaining: 300 }),
      point({ id: 'r2', period_to: '2026-04-01', automated: 200, active_scope: 500, remaining: 300 }),
    ])

    expect(result.qualityGate.status).toBe('yellow')
    expect(result.qualityGate.reasons).toContain('No visible progress vs previous report')
  })

  it('returns null 7d delta when no anchor point exists in 7d window', () => {
    const result = computeQaProjectRollup([
      point({ id: 'r1', period_to: '2026-03-15', automated: 50, active_scope: 500 }),
      point({ id: 'r2', period_to: '2026-04-01', automated: 200, active_scope: 500 }),
    ])

    // r1 is 17 days before r2, outside 7d window
    expect(result.automatedDeltaLast7Days).toBeNull()
  })

  it('handles empty history', () => {
    const result = computeQaProjectRollup([])
    expect(result.latestReport).toBeNull()
    expect(result.qualityGate.status).toBe('yellow')
    expect(result.qualityGate.reasons).toContain('No QA reports available')
  })
})
