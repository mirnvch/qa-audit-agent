import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  // Уроки курса — это .mdx-файлы, импортируемые из admin/content/lessons/.
  // Они НЕ являются страницами Next.js (страницы остаются в src/app/), поэтому
  // pageExtensions расширять не надо — у уроков общий шаблон рендера на странице
  // /learn/[moduleId]/[lessonId].
}

// ВАЖНО: для Turbopack плагины передаём СТРОКАМИ имён пакетов, а не как функции.
// Turbopack не сериализует Function-объекты в loader-options. createMDX резолвит
// строки на стороне Next.js и передаёт их корректно.
const withMDX = createMDX({
  options: {
    remarkPlugins: [['remark-gfm', {}]],
    rehypePlugins: [
      [
        'rehype-pretty-code',
        {
          theme: { light: 'github-light', dark: 'github-dark-dimmed' },
          keepBackground: false,
        },
      ],
    ],
  },
})

export default withMDX(nextConfig)
