// CLI: создать новую диаграмму.
//
// Usage:
//   npx tsx scripts/diagrams/create-diagram.ts \
//     --slug=cafe-vs-restaurant \
//     --title="Маленькое кафе vs большой ресторан" \
//     --description="…" \
//     --tags=intro,lesson-1.1 \
//     --excalidraw-json=tmp/diagrams/cafe-vs-restaurant.json
//
// Если slug уже занят — выходит с подсказкой использовать update-diagram.ts.

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { parseFlags, parseCsv } from './lib/args'
import { renderSvgs } from './lib/render-svg'
import { getServiceClient } from './lib/db'

async function main() {
  const flags = parseFlags({
    slug: { type: 'string', required: true },
    title: { type: 'string', required: true },
    description: { type: 'string' },
    tags: { type: 'string' },
    'excalidraw-json': { type: 'string', required: true },
  })

  const jsonPath = path.resolve(flags['excalidraw-json']!)
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

  const supabase = getServiceClient()

  // Проверяем уникальность slug ДО рендера, чтобы не тратить 5 сек впустую.
  const { data: existing } = await supabase
    .from('diagrams')
    .select('id')
    .eq('slug', flags.slug)
    .maybeSingle()
  if (existing) {
    console.error(`✗ Diagram with slug "${flags.slug}" already exists.`)
    console.error(`  Use update-diagram.ts to modify it, or pick a different --slug.`)
    process.exit(1)
  }

  console.log(`→ Rendering SVGs for "${flags.slug}"…`)
  const t0 = Date.now()
  const { svg_light, svg_dark } = await renderSvgs(excalidrawData)
  console.log(`✓ Rendered in ${Date.now() - t0}ms (light=${svg_light.length}b, dark=${svg_dark.length}b)`)

  const { data, error } = await supabase
    .from('diagrams')
    .insert({
      slug: flags.slug!,
      title: flags.title!,
      description: flags.description ?? null,
      tags: parseCsv(flags.tags),
      excalidraw_data: excalidrawData,
      svg_light,
      svg_dark,
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error(`✗ Insert failed: ${error.message}`)
    process.exit(1)
  }

  console.log(`✓ Created diagram id=${data.id} slug=${data.slug}`)
  console.log(`  Use in MDX: <Diagram id="${data.slug}" />`)
}

main().catch(e => {
  console.error('✗ Fatal:', e)
  process.exit(1)
})
