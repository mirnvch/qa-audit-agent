// Конфигурация курса «Архитектура QA-проекта Nexus».
// Все модули и уроки описаны здесь. Контент уроков — в admin/content/lessons/.

export type LessonStatus = 'published' | 'draft' | 'locked'

export type Lesson = {
  id: string                  // "1.1", "7.4" — отображается в UI
  moduleId: string            // совпадает с папкой в content/lessons/
  slug: string                // используется в URL: /learn/<moduleId>/<slug>
  title: string
  estimatedMinutes: number
  mdxPath: string             // путь относительно admin/content/lessons/
  status: LessonStatus
  /** Главная мысль урока — выводится в LessonHeader как выделенный quote-блок. */
  mainIdea?: string
}

export type Module = {
  id: string                  // папка в content/lessons/, напр. "01-architecture-basics"
  number: number              // 1..12 — для отображения "Модуль 7"
  title: string
  description: string         // 1–2 предложения, видны на главной /learn
  icon: string                // имя иконки lucide-react (ленивый импорт, см. icon-map.ts)
  lessons: Lesson[]
}

function lesson(
  moduleId: string,
  id: string,
  slug: string,
  title: string,
  estimatedMinutes: number,
  status: LessonStatus,
  extras?: { mainIdea?: string },
): Lesson {
  return {
    id,
    moduleId,
    slug,
    title,
    estimatedMinutes,
    mdxPath: `${moduleId}/${id}-${slug}.mdx`,
    status,
    mainIdea: extras?.mainIdea,
  }
}

export const COURSE_MODULES: Module[] = [
  {
    id: '01-architecture-basics',
    number: 1,
    title: 'Что такое архитектура и зачем она',
    description: 'База — что такое архитектура и зачем её делят на слои. С этого модуля стоит начать, даже если ты уже QA-инженер с опытом.',
    icon: 'Layers',
    lessons: [
      lesson(
        '01-architecture-basics', '1.1', 'problema-bolshogo-koda', 'Проблема большого кода', 50, 'published',
        {
          mainIdea:
            'Когда программа маленькая, можно «свалить» весь код в один файл, и оно будет работать. Когда программа становится большой, такой подход ломает всё. Архитектура — это решения о том, как разделить программу на части, чтобы её можно было читать, изменять и тестировать.',
        },
      ),
      lesson(
        '01-architecture-basics', '1.2', 'sloi-svyazannost-svyaznost', 'Слои, связанность, связность', 50, 'published',
        {
          mainIdea:
            'Слабые связи между модулями, сильные связи внутри модуля — формула, на которой стоит вся архитектура. Слои — это форма, в которую эти связи укладываются.',
        },
      ),
      lesson(
        '01-architecture-basics', '1.3', 'arkhitektura-v-qa-proekte', 'Архитектура в QA-проекте', 50, 'published',
        {
          mainIdea:
            'Тест-сьют — это полноценное приложение со своими слоями. Все принципы из 1.1 и 1.2 (слои, низкая связанность, высокая связность) применяются к тестам один-в-один. QA — архитектор тестов: можно делать это плохо или хорошо, но «никак» не получится.',
        },
      ),
    ],
  },
  {
    id: '02-meet-nexus',
    number: 2,
    title: 'Знакомство с Nexus',
    description: 'Что мы тестируем — доменная модель TMS и пирамида тестов. Контекст, без которого не понять остальной курс.',
    icon: 'Compass',
    lessons: [
      lesson(
        '02-meet-nexus', '2.1', 'chto-my-testiruem', 'Что мы тестируем — TMS, доменная модель', 40, 'published',
        {
          mainIdea:
            'TMS — это «Uber для грузовиков B2B». Чтобы хорошо тестировать такую систему, нужно понимать её домен: 5 ключевых сущностей (Client, Carrier, Shipment, Driver, Dispatch), их атрибуты и жизненные циклы. Без домена ты — кнопконажиматель. С доменом ты — инженер качества, который ловит логические баги, а не только опечатки в плейсхолдерах.',
        },
      ),
      lesson(
        '02-meet-nexus', '2.2', 'vidy-testov-i-piramida', 'Виды тестов и пирамида', 40, 'published',
        {
          mainIdea:
            'Пирамида тестов — это не теория из книжки, а математика стоимости и скорости. Чем выше слой теста, тем медленнее, дороже и хрупче он становится. Зрелый QA пишет тест на самом нижнем слое, где живёт правило. Не выше. Это правило экономит часы прогона и дни поддержки.',
        },
      ),
    ],
  },
  {
    id: '03-stack',
    number: 3,
    title: 'Стек и зависимости',
    description: 'Playwright, Vitest и вспомогательные библиотеки — что для чего, где границы между ними.',
    icon: 'Boxes',
    lessons: [
      lesson('03-stack', '3.1', 'playwright-i-vitest', 'Playwright и Vitest бок о бок',     45, 'draft'),
      lesson('03-stack', '3.2', 'vspomogatelnye-liby', 'Зачем нужны вспомогательные либы',  50, 'draft'),
      lesson('03-stack', '3.3', 'kastomnye-moduli',    'Кастомные внутренние модули',       50, 'draft'),
    ],
  },
  {
    id: '04-project-structure',
    number: 4,
    title: 'Структура папок и Bitbucket boundary',
    description: 'Как проект устроен на диске и почему репозиторий — это архитектурная граница.',
    icon: 'FolderTree',
    lessons: [
      lesson('04-project-structure', '4.1', 'derevo-proekta',     'Дерево проекта',     40, 'draft'),
      lesson('04-project-structure', '4.2', 'bitbucket-boundary', 'Bitbucket boundary', 35, 'draft'),
    ],
  },
  {
    id: '05-configuration',
    number: 5,
    title: 'Слой 1 — Configuration',
    description: 'ConfigurationManager как singleton, окружения, overrides. Откуда тест узнаёт, куда ему стучаться.',
    icon: 'Settings2',
    lessons: [
      lesson('05-configuration', '5.1', 'configuration-manager',   'ConfigurationManager как singleton', 50, 'draft'),
      lesson('05-configuration', '5.2', 'okruzheniya-i-overrides', 'Окружения и overrides',              45, 'draft'),
    ],
  },
  {
    id: '06-setup-auth',
    number: 6,
    title: 'Слой 2 — Setup и Auth',
    description: 'global-setup, авторизация, seededAssetRepo. Как тесты получают пользователя и подготовленные данные.',
    icon: 'KeyRound',
    lessons: [
      lesson('06-setup-auth', '6.1', 'global-setup',      'global-setup',      45, 'draft'),
      lesson('06-setup-auth', '6.2', 'seeded-asset-repo', 'seededAssetRepo',   50, 'draft'),
    ],
  },
  {
    id: '07-page-objects',
    number: 7,
    title: 'Слои 3-4 — Page Objects (главный модуль курса)',
    description: 'Сердце фреймворка: AppPage, BasePage, SelectorEntry, миграция Legacy → V2. Самый длинный модуль — пять уроков.',
    icon: 'Component',
    lessons: [
      lesson('07-page-objects', '7.1', 'zachem-page-object',     'Зачем Page Object',           50, 'draft'),
      lesson('07-page-objects', '7.2', 'v1-legacy-sign-in-page', 'V1 Legacy: signInPage',       50, 'draft'),
      lesson('07-page-objects', '7.3', 'v2-app-page-i-base-page','V2: AppPage и BasePage',      60, 'draft'),
      lesson('07-page-objects', '7.4', 'selector-entry',         'SelectorEntry и getPageSelectors', 50, 'draft'),
      lesson('07-page-objects', '7.5', 'v1-vs-v2-migration',     'V1 vs V2 рядом, миграция',    55, 'draft'),
    ],
  },
  {
    id: '08-support',
    number: 8,
    title: 'Слой 5 — Support',
    description: 'Fixtures как DI, GraphQL-фасад, фабрики данных, assertContext, иерархия ошибок и логирование. Шесть уроков подряд.',
    icon: 'LifeBuoy',
    lessons: [
      lesson('08-support', '8.1', 'fixtures-kak-di',       'Playwright Fixtures как DI',           55, 'draft'),
      lesson('08-support', '8.2', 'graphql-client-fasad',  'GraphQL-клиент: фасад + домены',       55, 'draft'),
      lesson('08-support', '8.3', 'fabriki-dannyh',        'Фабрики данных',                       50, 'draft'),
      lesson('08-support', '8.4', 'assert-context',        'assertContext: контекстный expect',    50, 'draft'),
      lesson('08-support', '8.5', 'test-failure-report',   'TestFailureReport и иерархия ошибок',  50, 'draft'),
      lesson('08-support', '8.6', 'logirovanie',           'Логирование как первичный артефакт',   45, 'draft'),
    ],
  },
  {
    id: '09-tests',
    number: 9,
    title: 'Слой 6 — Тесты',
    description: 'Структура UI- и API-тестов, naming convention, теги. То, что ученик пишет руками каждый день.',
    icon: 'TestTube2',
    lessons: [
      lesson('09-tests', '9.1', 'struktura-ui-testa',  'Структура UI-теста',          45, 'draft'),
      lesson('09-tests', '9.2', 'struktura-api-testa', 'Структура API-теста',         50, 'draft'),
      lesson('09-tests', '9.3', 'naming-i-tagi',       'Naming convention и теги',    35, 'draft'),
    ],
  },
  {
    id: '10-test-lifecycle',
    number: 10,
    title: 'Жизненный цикл теста',
    description: 'От `npm test` до отчёта — все этапы и артефакты, проходящие через систему.',
    icon: 'Activity',
    lessons: [
      lesson('10-test-lifecycle', '10.1', 'lifecycle-1-6',  'От npm test до отчёта — этапы 1-6', 50, 'draft'),
      lesson('10-test-lifecycle', '10.2', 'lifecycle-7-11', 'Этапы 7-11 и артефакты',            45, 'draft'),
    ],
  },
  {
    id: '11-config-cicd',
    number: 11,
    title: 'Конфигурация прогона и CI/CD',
    description: 'playwright.config, package.json scripts, Bitbucket Pipelines. Как тесты запускаются на CI.',
    icon: 'GitBranch',
    lessons: [
      lesson('11-config-cicd', '11.1', 'playwright-config',     'playwright.config.ts разбор', 50, 'draft'),
      lesson('11-config-cicd', '11.2', 'package-json-scripts',  'Команды package.json',        40, 'draft'),
      lesson('11-config-cicd', '11.3', 'bitbucket-pipelines',   'Bitbucket Pipelines',         45, 'draft'),
    ],
  },
  {
    id: '12-techdebt',
    number: 12,
    title: 'Техдолг и эволюция',
    description: 'Реестр техдолга, Q-N policy, zero-trust testing. Куда движется фреймворк.',
    icon: 'Wrench',
    lessons: [
      lesson('12-techdebt', '12.1', 'reestr-techdolga', 'Реестр техдолга',                       45, 'draft'),
      lesson('12-techdebt', '12.2', 'q-n-policy',       'Q-N policy и zero-trust testing',       45, 'draft'),
    ],
  },
]

// ─── Утилиты ───────────────────────────────────────────────

export const ALL_LESSONS: Lesson[] = COURSE_MODULES.flatMap(m => m.lessons)
export const TOTAL_LESSONS = ALL_LESSONS.length        // 35
export const TOTAL_MINUTES = ALL_LESSONS.reduce((sum, l) => sum + l.estimatedMinutes, 0)
export const TOTAL_HOURS_ROUNDED = Math.round(TOTAL_MINUTES / 60)

export function findModule(moduleId: string): Module | undefined {
  return COURSE_MODULES.find(m => m.id === moduleId)
}

export function findLesson(moduleId: string, slug: string): { module: Module; lesson: Lesson } | undefined {
  const mod = findModule(moduleId)
  if (!mod) return undefined
  const lesson = mod.lessons.find(l => l.slug === slug)
  if (!lesson) return undefined
  return { module: mod, lesson }
}

/** Линейный список (modIdx, lessonIdx) для prev/next-навигации. */
export function getLessonNeighbours(moduleId: string, slug: string): { prev?: Lesson; next?: Lesson } {
  const idx = ALL_LESSONS.findIndex(l => l.moduleId === moduleId && l.slug === slug)
  if (idx === -1) return {}
  return {
    prev: idx > 0 ? ALL_LESSONS[idx - 1] : undefined,
    next: idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : undefined,
  }
}

export function lessonHref(lesson: Lesson): string {
  return `/learn/${lesson.moduleId}/${lesson.slug}`
}

export function moduleHref(module: Module): string {
  return `/learn/${module.id}`
}
