// Сканируем content/lessons на предмет <Diagram id="..." /> и собираем
// словарь "slug → список уроков, в которых она встречается".
//
// Решение из Phase 1: не храним used_in_lessons в БД, а считаем на лету
// при загрузке каталога. Колонка used_in_lessons в схеме есть как
// зарезервированная для возможной будущей материализации.

import fs from 'node:fs/promises'
import path from 'node:path'

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'lessons')
const DIAGRAM_RE = /<Diagram\s+[^>]*\bid\s*=\s*"([^"]+)"/g

/**
 * @returns Map slug → массив lessonId формата "<moduleId>/<file-without-ext>"
 *          (тот же формат, что mdxPath в course-config, без .mdx).
 */
export async function getDiagramUsage(): Promise<Map<string, string[]>> {
  const usage = new Map<string, string[]>()

  let moduleDirs: string[]
  try {
    moduleDirs = await fs.readdir(CONTENT_ROOT)
  } catch {
    // content/lessons может не существовать в edge-случае — возвращаем пустую карту
    return usage
  }

  for (const moduleDir of moduleDirs) {
    const moduleAbs = path.join(CONTENT_ROOT, moduleDir)

    let stat
    try { stat = await fs.stat(moduleAbs) } catch { continue }
    if (!stat.isDirectory()) continue

    let files: string[]
    try { files = await fs.readdir(moduleAbs) } catch { continue }

    for (const file of files) {
      if (!file.endsWith('.mdx')) continue

      const filepath = path.join(moduleAbs, file)
      let content: string
      try { content = await fs.readFile(filepath, 'utf8') } catch { continue }

      const lessonId = `${moduleDir}/${file.replace(/\.mdx$/, '')}`
      for (const m of content.matchAll(DIAGRAM_RE)) {
        const slug = m[1]
        const arr = usage.get(slug)
        if (arr) {
          if (!arr.includes(lessonId)) arr.push(lessonId)
        } else {
          usage.set(slug, [lessonId])
        }
      }
    }
  }

  return usage
}

/** Удобный helper для одного slug. */
export async function getUsageForSlug(slug: string): Promise<string[]> {
  const usage = await getDiagramUsage()
  return usage.get(slug) ?? []
}
