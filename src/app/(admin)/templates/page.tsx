import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TemplateActions } from '@/components/template-actions'
import type { EmailTemplate } from '@/lib/supabase/types'

const PAGE_SIZE = 20

type Props = {
  searchParams: Promise<{ page?: string }>
}

async function getTemplates(page: number): Promise<{ templates: EmailTemplate[]; total: number }> {
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  try {
    const supabase = await createClient()
    const { data, error, count } = await supabase
      .from('email_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw error
    return { templates: (data ?? []) as EmailTemplate[], total: count ?? 0 }
  } catch {
    return { templates: [], total: 0 }
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function TemplatesPage({ searchParams }: Props) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10))

  const { templates, total } = await getTemplates(page)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const fromItem = (page - 1) * PAGE_SIZE + 1
  const toItem = Math.min(page * PAGE_SIZE, total)

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono text-muted-foreground/60 tracking-[0.15em] uppercase mb-1">
            Section 05 · Email Templates
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        </div>

        <Link
          href="/templates/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
        >
          New Template
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
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Subject
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Variables
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10">
                Created
              </TableHead>
              <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium h-10 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="text-center py-12"
                >
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-mono">
                      No templates yet
                    </p>
                    <Link
                      href="/templates/new"
                      className="text-sm text-primary hover:underline"
                    >
                      Create your first template
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow
                  key={template.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <Link href={`/templates/${template.id}`} className="block">
                      <span className="font-semibold text-sm text-foreground">
                        {template.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/templates/${template.id}`} className="block">
                      <span className="text-sm text-muted-foreground truncate max-w-[300px] block">
                        {template.subject}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/templates/${template.id}`} className="block">
                      <span className="text-xs font-mono text-muted-foreground">
                        {template.variables.length > 0
                          ? template.variables.join(', ')
                          : '--'}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/templates/${template.id}`} className="block">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(template.created_at)}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TemplateActions templateId={template.id} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground/60">
            Showing {fromItem}–{toItem} of {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={page - 1 === 1 ? '/templates' : `/templates?page=${page - 1}`}
                className="px-3 py-1.5 rounded-md text-xs font-mono font-medium border border-border/50 hover:bg-muted/40 transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="text-xs font-mono text-muted-foreground">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/templates?page=${page + 1}`}
                className="px-3 py-1.5 rounded-md text-xs font-mono font-medium border border-border/50 hover:bg-muted/40 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
