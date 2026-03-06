import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/format'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SequenceActions } from '@/components/sequence-actions'
import type { EmailSequence, SequenceStep } from '@/lib/supabase/types'

async function getSequences(): Promise<EmailSequence[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('email_sequences')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []) as EmailSequence[]
  } catch {
    return []
  }
}

export default async function SequencesPage() {
  const sequences = await getSequences()

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
            Section 06 · Email Sequences
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Sequences</h1>
        </div>

        <Link
          href="/sequences/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
        >
          New Sequence
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Name
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 text-right">
                Steps
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Created
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sequences.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-mono">
                      No sequences yet
                    </p>
                    <Link
                      href="/sequences/new"
                      className="text-sm text-primary hover:underline"
                    >
                      Create your first email sequence
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sequences.map((seq) => {
                const steps = (seq.steps ?? []) as SequenceStep[]

                return (
                  <TableRow
                    key={seq.id}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <TableCell>
                      <Link href={`/sequences/${seq.id}`} className="block">
                        <span className="font-semibold text-sm text-foreground">
                          {seq.name}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/sequences/${seq.id}`} className="block">
                        <span className="font-mono text-sm">
                          {steps.length}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/sequences/${seq.id}`} className="block">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(seq.created_at)}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <SequenceActions sequenceId={seq.id} />
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
