// CLI: обновить существующую диаграмму.
//
// Usage:
//   npx tsx scripts/diagrams/update-diagram.ts \
//     --slug=cafe-vs-restaurant \
//     [--title="…"] [--description="…"] [--tags=t1,t2] \
//     [--excalidraw-json=path.json]
//
// Если задан --excalidraw-json — пере-рендерит обе SVG и обновляет excalidraw_data.
// Иначе — обновляет только метаданные.

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { parseFlags, parseCsv } from './lib/args'
import { renderSvgs } from './lib/render-svg'
import { getServiceClient } from './lib/db'

async function main() {
  const flags = parseFlags({
    slug: { type: 'string', required: true },
    title: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'string' },
    'excalidraw-json': { type: 'string' },
  })

  const supabase = getServiceClient()

  const { data: existing } = await supabase
    .from('diagrams')
    .select('id, slug')
    .eq('slug', flags.slug)
    .maybeSingle()
  if (!existing) {
    console.error(`✗ Diagram with slug "${flags.slug}" not found.`)
    process.exit(1)
  }

  const updates: Record<string, unknown> = {}
  if (flags.title !== undefined) updates.title = flags.title
  if (flags.description !== undefined) updates.description = flags.description
  if (flags.tags !== undefined) updates.tags = parseCsv(flags.tags)

  if (flags['excalidraw-json']) {
    const jsonPath = path.resolve(flags['excalidraw-json'])
    if (!existsSync(jsonPath)) {
      console.error(`✗ File not found: ${jsonPath}`)
      process.exit(1)
    }
    let excalidrawData: unknown
    try {
      excalidrawData = JSON.parse(readFileSync(jsonPath, 'utf8'))
    } catch (e) {
      console.error(`✗ Invalid JSON in ${jsonPath}: ${(e as Error).message}`)
      process.exit(1)
    }
    console.log(`→ Re-rendering SVGs…`)
    const t0 = Date.now()
    const { svg_light, svg_dark } = await renderSvgs(excalidrawData)
    console.log(`✓ Rendered in ${Date.now() - t0}ms`)
    updates.excalidraw_data = excalidrawData
    updates.svg_light = svg_light
    updates.svg_dark = svg_dark
  }

  if (Object.keys(updates).length === 0) {
    console.error('✗ Nothing to update — pass at least one of --title --description --tags --excalidraw-json')
    process.exit(1)
  }

  const { error } = await supabase.from('diagrams').update(updates).eq('slug', flags.slug)
  if (error) {
    console.error(`✗ Update failed: ${error.message}`)
    process.exit(1)
  }

  console.log(`✓ Updated diagram slug=${flags.slug} (fields: ${Object.keys(updates).join(', ')})`)
}

main().catch(e => {
  console.error('✗ Fatal:', e)
  process.exit(1)
})
