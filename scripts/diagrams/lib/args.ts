// Тонкий wrapper над node:util.parseArgs — общая обвязка для CLI.

import { parseArgs as nodeParseArgs } from 'node:util'

export function parseFlags<T extends Record<string, { type: 'string' | 'boolean'; required?: boolean }>>(
  schema: T,
): { [K in keyof T]: T[K]['type'] extends 'boolean' ? boolean | undefined : string | undefined } {
  const options: Record<string, { type: 'string' | 'boolean' }> = {}
  for (const [name, def] of Object.entries(schema)) {
    options[name] = { type: def.type }
  }

  let parsed: { values: Record<string, string | boolean | undefined> }
  try {
    parsed = nodeParseArgs({ options, allowPositionals: false, strict: true })
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`)
    process.exit(1)
  }

  // Required-checks
  for (const [name, def] of Object.entries(schema)) {
    if (def.required && parsed.values[name] === undefined) {
      console.error(`✗ Missing required flag --${name}`)
      process.exit(1)
    }
  }

  return parsed.values as never
}

/** Парсит "tag1,tag2,tag3" в ["tag1","tag2","tag3"] (без пустых). */
export function parseCsv(value: string | undefined): string[] {
  if (!value) return []
  return value.split(',').map(s => s.trim()).filter(Boolean)
}
