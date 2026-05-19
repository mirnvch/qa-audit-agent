import type { QaRunTestStatus } from '@/lib/qa/run-schema'

type Props = {
  status: QaRunTestStatus
}

const styles: Record<QaRunTestStatus, string> = {
  passed: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  skipped: 'bg-muted/30 text-muted-foreground border-border',
  pending: 'bg-muted/30 text-muted-foreground border-border',
  todo: 'bg-muted/30 text-muted-foreground border-border',
  flaky: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

/**
 * Tiny status chip used in tables and category rows. Matches the PC pill
 * vocabulary (passed / failed / skipped) extended with flaky for daily runs
 * that surface intermittent failures.
 */
export function QaRunStatusPill({ status }: Props) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] rounded-full border ${styles[status]}`}
    >
      {status}
    </span>
  )
}
