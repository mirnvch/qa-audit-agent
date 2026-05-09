/**
 * Явный реестр MDX-уроков. Каждый новый урок — одна строка здесь.
 *
 * Почему явный реестр, а не file-system routing:
 *  - Уроки — НЕ страницы. У всех общий шаблон /learn/[moduleId]/[lessonId],
 *    а файлы .mdx — это просто React-компоненты, которые этот шаблон рендерит.
 *  - Динамический import по строке URL без явной map-таблицы тоже работает
 *    (`await import(`@/content/lessons/${slug}.mdx`)`), но он невидим для
 *    TypeScript-а: «найти, откуда грузится урок» — только через grep.
 *  - С явным реестром урок виден ровно в одном месте — здесь. Поиск usages
 *    работает, опечатки в путях ловит компилятор.
 *
 * Trade-off: чуть больше ручной работы при добавлении урока (одна строка),
 * взамен — типобезопасность и работающий «Find Usages».
 *
 * Ключ реестра — это `mdxPath` из course-config.ts БЕЗ расширения .mdx.
 * Регистр критичен: ключ должен совпадать с тем, что вернёт `lesson.mdxPath`,
 * с которого срезано `.mdx`.
 */

import type { ComponentType } from 'react'

type MdxModule = { default: ComponentType }

type LessonImporter = () => Promise<MdxModule>

export const lessonsRegistry: Record<string, LessonImporter> = {
  '01-architecture-basics/1.1-problema-bolshogo-koda':
    () => import('@content/lessons/01-architecture-basics/1.1-problema-bolshogo-koda.mdx'),
  '01-architecture-basics/1.2-sloi-svyazannost-svyaznost':
    () => import('@content/lessons/01-architecture-basics/1.2-sloi-svyazannost-svyaznost.mdx'),
  '01-architecture-basics/1.3-arkhitektura-v-qa-proekte':
    () => import('@content/lessons/01-architecture-basics/1.3-arkhitektura-v-qa-proekte.mdx'),
  '02-meet-nexus/2.1-chto-my-testiruem':
    () => import('@content/lessons/02-meet-nexus/2.1-chto-my-testiruem.mdx'),
}

/** Получить importer урока по mdxPath из course-config (с .mdx или без — нормализуется). */
export function getLessonImporter(mdxPath: string): LessonImporter | undefined {
  const key = mdxPath.replace(/\.mdx$/i, '')
  return lessonsRegistry[key]
}
