// Лист по содержимому всех .excalidrawlib файлов в .claude/skills/excalidraw-diagram/libraries/.
//
// Использование:
//   npm run diagram:list-library                      — все элементы из всех библиотек
//   npm run diagram:list-library -- --grep="postgres" — фильтр по подстроке (case-insensitive)
//   npm run diagram:list-library -- --library=aws     — конкретная библиотека по подстроке имени файла
//
// Поддерживает оба формата .excalidrawlib:
//   v1 — `library: [[elements...], ...]` (templates без metadata; печатаем как "Template N")
//   v2 — `libraryItems: [{id, name, status, elements, ...}]` (named items с metadata)

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const SKILL_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../.claude/skills/excalidraw-diagram',
)
const LIB_DIR = path.join(SKILL_DIR, 'libraries')

type V2Item = {
  id?: string
  name?: string
  status?: string
  elements?: unknown[]
}

function parseArgs(): { grep?: string; library?: string } {
  const out: { grep?: string; library?: string } = {}
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, '').split('=')
    if (k === 'grep' && v) out.grep = v.toLowerCase()
    else if (k === 'library' && v) out.library = v.toLowerCase()
  }
  return out
}

function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n - 1) + '…'
  return s + ' '.repeat(n - s.length)
}

const { grep, library: libFilter } = parseArgs()

let files: string[]
try {
  files = readdirSync(LIB_DIR).filter(f => f.endsWith('.excalidrawlib'))
} catch (e) {
  console.error(`Cannot read ${LIB_DIR}: ${(e as Error).message}`)
  process.exit(1)
}

if (files.length === 0) {
  console.log(`No .excalidrawlib files in ${LIB_DIR}`)
  process.exit(0)
}

console.log(`\nLibraries dir: ${LIB_DIR}\n`)

let totalShown = 0
let totalAll = 0

for (const file of files.sort()) {
  if (libFilter && !file.toLowerCase().includes(libFilter)) continue

  const fullPath = path.join(LIB_DIR, file)
  const sizeKb = (statSync(fullPath).size / 1024).toFixed(0)

  let raw: string
  let parsed: { type?: string; version?: number; library?: unknown[]; libraryItems?: V2Item[] }
  try {
    raw = readFileSync(fullPath, 'utf8')
    parsed = JSON.parse(raw)
  } catch (e) {
    console.log(`  ✗ ${file} — parse error: ${(e as Error).message}`)
    continue
  }

  const v2Items = Array.isArray(parsed.libraryItems) ? parsed.libraryItems : null
  const v1Templates = Array.isArray(parsed.library) ? parsed.library : null

  console.log(`╔══ ${file} (${sizeKb} KB, format v${parsed.version ?? '?'}) ══`)

  if (v2Items) {
    const matching = v2Items.filter(it => !grep || (it.name || '').toLowerCase().includes(grep))
    totalAll += v2Items.length
    totalShown += matching.length
    console.log(`║ ${v2Items.length} items${grep ? ` — ${matching.length} match "${grep}"` : ''}`)
    console.log('║')
    console.log(`║ ${pad('NAME', 36)} ${pad('ID', 22)} ${pad('STATUS', 10)} N`)
    console.log('║ ' + '─'.repeat(76))
    for (const it of matching) {
      const n = it.elements?.length ?? 0
      console.log(`║ ${pad(it.name || '<no name>', 36)} ${pad(it.id || '?', 22)} ${pad(it.status || '?', 10)} ${n}`)
    }
  } else if (v1Templates) {
    totalAll += v1Templates.length
    console.log(`║ v1 format — ${v1Templates.length} template(s) (no per-item names)`)
    console.log('║')
    v1Templates.forEach((tpl, i) => {
      const els = Array.isArray(tpl) ? tpl : []
      const types = new Set(els.slice(0, 50).map((e: unknown) => (e as { type?: string }).type || '?'))
      console.log(`║   Template ${i}: ${els.length} elements (${[...types].join(', ')})`)
    })
    totalShown += v1Templates.length
  } else {
    console.log('║ Unknown format (no library/libraryItems array)')
  }

  console.log('╚══')
  console.log('')
}

console.log(`Total: ${totalShown}${grep ? ` of ${totalAll}` : ''} items shown.`)
if (grep) console.log(`Filter: name contains "${grep}"`)
if (libFilter) console.log(`Library filter: filename contains "${libFilter}"`)
