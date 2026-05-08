// CLI: удалить диаграмму по slug.

import { parseFlags } from './lib/args'
import { getServiceClient } from './lib/db'

async function main() {
  const flags = parseFlags({
    slug: { type: 'string', required: true },
    yes: { type: 'boolean' },
  })

  const supabase = getServiceClient()

  const { data: existing } = await supabase
    .from('diagrams')
    .select('id, slug, title')
    .eq('slug', flags.slug)
    .maybeSingle()
  if (!existing) {
    console.error(`✗ Diagram with slug "${flags.slug}" not found.`)
    process.exit(1)
  }

  if (!flags.yes) {
    console.error(`! Will delete: ${existing.title} (slug=${existing.slug})`)
    console.error(`  Re-run with --yes to confirm.`)
    process.exit(1)
  }

  const { error } = await supabase.from('diagrams').delete().eq('slug', flags.slug)
  if (error) {
    console.error(`✗ Delete failed: ${error.message}`)
    process.exit(1)
  }
  console.log(`✓ Deleted slug=${flags.slug}`)
}

main().catch(e => {
  console.error('✗ Fatal:', e)
  process.exit(1)
})
