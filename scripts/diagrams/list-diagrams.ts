// CLI: список всех диаграмм с метаданными.

import { getServiceClient } from './lib/db'

async function main() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('slug, title, tags, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`✗ ${error.message}`)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('No diagrams.')
    return
  }

  console.log(`Total: ${data.length}`)
  console.log('─'.repeat(80))
  for (const d of data) {
    const tags = d.tags?.length ? `[${d.tags.join(', ')}]` : ''
    console.log(`  ${d.slug.padEnd(30)} ${d.title}  ${tags}`)
    console.log(`    created: ${d.created_at}    updated: ${d.updated_at}`)
  }
}

main().catch(e => {
  console.error('✗ Fatal:', e)
  process.exit(1)
})
