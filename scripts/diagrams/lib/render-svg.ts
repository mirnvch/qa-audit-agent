// Рендер SVG для двух тем (light + dark) через headless chromium.
// Использует тот же локальный bundle Excalidraw, что render-pipeline skill'а.
//
// Bundle лежит в .claude/skills/excalidraw-diagram/references/excalidraw-bundle.js,
// собирается командой `npm run diagram:rebuild-renderer` (см. admin/package.json).

import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const SKILL_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../.claude/skills/excalidraw-diagram/references',
)
const TEMPLATE_PATH = path.join(SKILL_DIR, 'render_template.html')
const BUNDLE_PATH = path.join(SKILL_DIR, 'excalidraw-bundle.js')

export type RenderResult = {
  svg_light: string
  svg_dark: string
}

// Маппинг strokeColor для dark-варианта.
// Источник правды — `references/color-palette.md` → секция «Light → Dark mapping».
// Применяем ТОЛЬКО к:
//   - text БЕЗ containerId (свободно стоящий — заголовки, подписи, описания);
//   - line (структурные dividers, tree-trunks, timelines).
// Остальные элементы оставляем как есть, чтобы:
//   - не поломать контраст текста ВНУТРИ светлых rect-зон;
//   - не затереть stroke-цвета цветных shape (orange/blue/green/...);
//   - не сломать цвет dot-маркеров (у них свой fill).
//
// СОГЛАШЕНИЕ:
//   - #0f172a и #1e293b (slate-900/800) НЕ в mapping — это «inside-shape text» цвета,
//     которые должны оставаться тёмными в обеих темах (фоны зон pastel и в light, и в dark).
//     Используй их для текста ВНУТРИ цветных rect/ellipse.
//   - #475569, #1e3a8a, #94a3b8 (canvas-level) — в mapping, чтобы заголовки/подписи поверх
//     canvas адекватно становились light в dark theme.
const DARK_COLOR_MAPPING: Record<string, string> = {
  '#334155': '#cbd5e1', // slate-700 → slate-300
  '#475569': '#94a3b8', // slate-600 → slate-400 (body)
  '#64748b': '#94a3b8', // slate-500 → slate-400
  '#1e3a8a': '#bfdbfe', // blue-900 → blue-200 (slate-blue subtitle)
  '#94a3b8': '#64748b', // slate-400 → slate-500 (структурные линии)
  '#b91c1c': '#fca5a5', // red-700 → red-300 (alarm-подписи/текст поверх canvas)
  '#065f46': '#6ee7b7', // green-800 → green-300 (success-подписи/текст поверх canvas)
}

type ExcalidrawElement = {
  type: string
  strokeColor?: string
  containerId?: string | null
  [k: string]: unknown
}

function transformForDark(elements: ExcalidrawElement[]): ExcalidrawElement[] {
  return elements.map(el => {
    const isFreeText = el.type === 'text' && !el.containerId
    const isLine = el.type === 'line'
    if (!isFreeText && !isLine) return el

    const stroke = el.strokeColor?.toLowerCase()
    if (!stroke) return el
    const mapped = DARK_COLOR_MAPPING[stroke]
    if (!mapped) return el

    return { ...el, strokeColor: mapped }
  })
}

export async function renderSvgs(excalidrawData: unknown): Promise<RenderResult> {
  if (!existsSync(TEMPLATE_PATH)) {
    throw new Error(`Render template not found: ${TEMPLATE_PATH}`)
  }
  if (!existsSync(BUNDLE_PATH)) {
    throw new Error(
      `Excalidraw bundle not found at ${BUNDLE_PATH}. ` +
      `Run: npm run diagram:rebuild-renderer`,
    )
  }

  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
    page.on('pageerror', e => console.warn('[browser]', e.message))

    await page.goto(pathToFileURL(TEMPLATE_PATH).href)
    await page.waitForFunction('window.__moduleReady === true', null, { timeout: 30_000 })

    // Экспортим обе темы. exportBackground:false — прозрачный фон;
    // appState.theme заставляет Excalidraw подменить цвета элементов
    // под целевую тему.
    const svg_light = await page.evaluate(async (data) => {
      const w = window as unknown as { exportToSvg: (opts: unknown) => Promise<SVGElement> }
      const dataObj = data as { elements?: unknown[]; appState?: Record<string, unknown>; files?: unknown }
      const svg = await w.exportToSvg({
        elements: dataObj.elements ?? [],
        appState: { ...(dataObj.appState ?? {}), theme: 'light', exportBackground: false },
        files: dataObj.files ?? {},
      })
      return svg.outerHTML
    }, excalidrawData)

    // Для dark — трансформируем strokeColor у free-text и line по DARK_COLOR_MAPPING,
    // потом отдаём в exportToSvg.
    const dataObj = excalidrawData as { elements?: ExcalidrawElement[]; appState?: Record<string, unknown>; files?: unknown }
    const darkData = {
      ...dataObj,
      elements: transformForDark(dataObj.elements ?? []),
    }

    const svg_dark = await page.evaluate(async (data) => {
      const w = window as unknown as { exportToSvg: (opts: unknown) => Promise<SVGElement> }
      const dObj = data as { elements?: unknown[]; appState?: Record<string, unknown>; files?: unknown }
      const svg = await w.exportToSvg({
        elements: dObj.elements ?? [],
        appState: { ...(dObj.appState ?? {}), theme: 'dark', exportBackground: false },
        files: dObj.files ?? {},
      })
      return svg.outerHTML
    }, darkData)

    return { svg_light, svg_dark }
  } finally {
    await browser.close()
  }
}
