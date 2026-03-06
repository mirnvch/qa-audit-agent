import Link from 'next/link'
import { SequenceForm } from '@/components/sequence-form'
import { createSequence } from '@/app/(admin)/sequences/actions'

export default function NewSequencePage() {
  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <Link href="/sequences" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-mono mb-6">
        &larr; Sequences
      </Link>
      <div className="mb-6">
        <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
          New Sequence
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Create Sequence</h1>
      </div>
      <SequenceForm action={createSequence} />
    </div>
  )
}
