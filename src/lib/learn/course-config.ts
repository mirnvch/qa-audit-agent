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

// Курс = набор модулей со своей обложкой (landing). Приложение поддерживает
// несколько курсов, каждый со своим входом. moduleId уникальны ГЛОБАЛЬНО
// (между курсами), поэтому маршруты /learn/<moduleId>/<slug> общие для всех
// курсов — разделяет их только лендинг и курс-зависимый сайдбар.
export type Course = {
  id: string                  // "architecture" | "testing-types"
  title: string
  description: string
  landingHref: string         // "/learn" (архитектура) | "/learn/testing-types"
  modules: Module[]
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
      lesson(
        '03-stack', '3.1', 'playwright-i-vitest', 'Playwright и Vitest бок о бок', 45, 'published',
        {
          mainIdea:
            'Один проект — два раннера, разделённые по расширению: .spec.ts для Playwright, .test.ts для Vitest. Это не каприз, а архитектурное решение: каждый раннер заточен под свой класс задач. Vitest — для чистой логики (быстро, без браузера). Playwright — для browser end-to-end (с настоящим Chromium). Один — не заменяет другого.',
        },
      ),
      lesson(
        '03-stack', '3.2', 'vspomogatelnye-liby', 'Зачем нужны вспомогательные либы', 50, 'published',
        {
          mainIdea:
            'Раннер тестов решает 20% задач. Остальные 80% — это качество логов, генерация данных, фабрики, проверка контрактов API, защита кода до commit, обход анти-бот защиты при логине. Шесть вспомогательных либ — Pino, Faker, Fishery, AJV, Lefthook, stealth — каждая закрывает одну дырку. Без них можно писать тесты, но это будет медленно, шумно и хрупко.',
        },
      ),
      lesson(
        '03-stack', '3.3', 'kastomnye-moduli', 'Кастомные внутренние модули', 55, 'published',
        {
          mainIdea:
            'Зрелая команда не пользуется одним только Playwright и стандартными либами. Поверх них она строит свой собственный слой кастомных модулей: ConfigurationManager (типизированное окружение), AppPage (Page Object с автологами), GraphQLClient (фасад над API), seededAssetRepo (safety-net cleanup), withContext (контекст в ассертах), TestFailureReport (структурированный отчёт). Без этого слоя проект — «голый Playwright», и он не масштабируется дальше пары сотен тестов.',
        },
      ),
    ],
  },
  {
    id: '04-project-structure',
    number: 4,
    title: 'Структура папок и Bitbucket boundary',
    description: 'Как проект устроен на диске и почему репозиторий — это архитектурная граница.',
    icon: 'FolderTree',
    lessons: [
      lesson(
        '04-project-structure', '4.1', 'derevo-proekta', 'Дерево проекта', 50, 'published',
        {
          mainIdea:
            'Структура папок — это не каприз, а карта мышления команды. Хорошее дерево проекта говорит само за себя: видишь папку — понимаешь, что внутри и зачем. Плохое — заставляет искать «а где же тесты на логин» по всему репозиторию, открывая файл за файлом наугад.',
        },
      ),
      lesson(
        '04-project-structure', '4.2', 'bitbucket-boundary', 'Bitbucket boundary', 55, 'published',
        {
          mainIdea:
            'Не всё, что лежит в папке проекта, должно ехать в общий репозиторий. Есть осознанная граница: runtime-код (тесты, страницы, конфиги) — версионируется и едет всем. Вспомогательное (локальные заметки, эксперименты, артефакты, секреты) — остаётся на твоей машине. Эта граница защищает и репозиторий от мусора, и команду от утечек.',
        },
      ),
    ],
  },
  {
    id: '05-configuration',
    number: 5,
    title: 'Слой 1 — Configuration',
    description: 'ConfigurationManager как singleton, окружения, overrides. Откуда тест узнаёт, куда ему стучаться.',
    icon: 'Settings2',
    lessons: [
      lesson(
        '05-configuration', '5.1', 'configuration-manager', 'ConfigurationManager как singleton', 60, 'published',
        {
          mainIdea:
            'Настройки приложения — это не то, что хватают откуда попало. Зрелый проект имеет одну точку правды о конфигурации: типизированный объект, через который проходят все обращения к окружению. Это singleton — он создаётся один раз и живёт на весь прогон. Опечатки в именах переменных ловятся компилятором, а не падающим в проде тестом.',
        },
      ),
      lesson(
        '05-configuration', '5.2', 'okruzheniya-i-overrides', 'Окружения и overrides', 60, 'published',
        {
          mainIdea:
            'Один и тот же тест должен работать в local, staging и prod — без единого изменения кода. Окружение выбирается снаружи, через переменную, а не зашивается внутрь. Это даёт гибкость: запустил локально для дебага, тот же тест прогнал на staging в CI, и при необходимости — точечно переопределил отдельную настройку через override.',
        },
      ),
    ],
  },
  {
    id: '06-setup-auth',
    number: 6,
    title: 'Слой 2 — Setup и Auth',
    description: 'global-setup, авторизация, seededAssetRepo. Как тесты получают пользователя и подготовленные данные.',
    icon: 'KeyRound',
    lessons: [
      lesson(
        '06-setup-auth', '6.1', 'global-setup', 'global-setup', 60, 'published',
        {
          mainIdea:
            'Некоторые вещи нужно сделать один раз перед всеми тестами, а не в каждом тесте отдельно. Логин — главный пример: авторизоваться 200 раз перед 200 тестами — это десятки минут впустую. global-setup логинится один раз, сохраняет сессию в файл, и все тесты стартуют уже залогиненными. Это разница между прогоном в 50 минут и в 10.',
        },
      ),
      lesson(
        '06-setup-auth', '6.2', 'seeded-asset-repo', 'seededAssetRepo', 60, 'published',
        {
          mainIdea:
            'Тесты создают данные — и обязаны за собой убирать. Если каждый тест оставляет мусор, через месяц база полна тысяч «test user 4471». seededAssetRepo — это реестр: записал, что создал, и safety-net гарантирует уборку в конце, даже если тест упал на середине. Чистая база после прогона — признак зрелого тест-сьюта.',
        },
      ),
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

// ─── Курс «Виды тестирования» (отдельный вход) ─────────────
// Отдельный курс со своей обложкой /learn/testing-types. moduleId уникальны
// между курсами, поэтому уроки рендерятся через общие маршруты
// /learn/<moduleId>/<slug>. ВАЖНО: прогресс хранит lesson.id ГЛОБАЛЬНО, поэтому
// id здесь с префиксом "T", чтобы не пересечься с архитектурными "1.1".."12.2".
export const TESTING_MODULES: Module[] = [
  {
    id: 'contract-testing',
    number: 1,
    title: 'Контрактное тестирование',
    description: 'Проверяем, что сервер отдаёт данные в согласованном виде — сначала правильную форму ответа, потом правильные значения внутри. Простым языком, на реальном коде.',
    icon: 'FileCheck2',
    lessons: [
      lesson(
        'contract-testing', 'T1.1', 'kontrakt-forma', 'Контракт формы ответа', 30, 'published',
        {
          mainIdea:
            'Контрактное тестирование проверяет не значения, а форму ответа: те же поля, те же типы, ту же структуру, о которой договорились с сервером. Это как проверять не качество груза, а правильно ли оформлена накладная. Самая дешёвая страховка от класса поломок, когда сервер молча меняет форму ответа и ломает всех, кто её читает.',
        },
      ),
      lesson(
        'contract-testing', 'T1.2', 'kontrakt-kachestvo-dannyh', 'Контракт качества данных', 30, 'published',
        {
          mainIdea:
            'Правильная форма — это только полдела. Контракт качества данных идёт дальше и проверяет, что внутри верной формы лежат правильные значения: статус именно ACTIVE, баланс именно 0 после оплаты. Слабая проверка «есть хоть что-то» пропускает баги (и даже валит правильный ноль); строгая проверка «ровно это значение» их ловит.',
        },
      ),
    ],
  },
  {
    id: 'combinatorial-testing',
    number: 2,
    title: 'Комбинаторное тестирование',
    description: 'Когда параметров и значений много, все комбинации не перебрать. Pairwise (попарное) покрывает все пары значений минимальным набором тестов — и ловит большинство багов малой кровью.',
    icon: 'Grid3x3',
    lessons: [
      lesson(
        'combinatorial-testing', 'T2.1', 'pairwise', 'Pairwise: покрываем пары, не все комбинации', 30, 'published',
        {
          mainIdea:
            'Когда у фичи много параметров с разными значениями, все комбинации не перебрать — их слишком много (комбинаторный взрыв). Pairwise покрывает все ПАРЫ значений минимальным набором тестов. Работает потому, что большинство багов вызвано одним значением или парой, а не редкой тройкой.',
        },
      ),
    ],
  },
]

// ─── Реестр курсов ─────────────────────────────────────────

export const COURSES: Course[] = [
  {
    id: 'architecture',
    title: 'Архитектура QA-проекта Nexus',
    description: 'Как устроен production-grade Playwright-фреймворк: слои, фикстуры, page-objects, фабрики данных, обработка ошибок, CI/CD и техдолг.',
    landingHref: '/learn',
    modules: COURSE_MODULES,
  },
  {
    id: 'testing-types',
    title: 'Виды тестирования простыми словами',
    description: 'Что за подходы к тестированию бывают, зачем они нужны и как выглядят на реальном коде. Без жаргона, с примерами из жизни.',
    landingHref: '/learn/testing-types',
    modules: TESTING_MODULES,
  },
]

/** Все модули всех курсов — для резолва общих маршрутов /learn/<moduleId>. */
export const ALL_MODULES: Module[] = COURSES.flatMap(c => c.modules)

// ─── Утилиты ───────────────────────────────────────────────

// Прогресс/счётчики архитектурного курса считаем от COURSE_MODULES, чтобы
// обложка /learn осталась ровно такой же. Для второго курса счётчики берём
// через courseLessonCount(course).
export const ALL_LESSONS: Lesson[] = COURSE_MODULES.flatMap(m => m.lessons)
export const TOTAL_LESSONS = ALL_LESSONS.length        // 35
export const TOTAL_MINUTES = ALL_LESSONS.reduce((sum, l) => sum + l.estimatedMinutes, 0)
export const TOTAL_HOURS_ROUNDED = Math.round(TOTAL_MINUTES / 60)

export function findModule(moduleId: string): Module | undefined {
  return ALL_MODULES.find(m => m.id === moduleId)
}

export function findLesson(moduleId: string, slug: string): { module: Module; lesson: Lesson } | undefined {
  const mod = findModule(moduleId)
  if (!mod) return undefined
  const lesson = mod.lessons.find(l => l.slug === slug)
  if (!lesson) return undefined
  return { module: mod, lesson }
}

/** Курс, которому принадлежит модуль (по moduleId). */
export function courseForModule(moduleId: string | undefined): Course | undefined {
  if (!moduleId) return undefined
  return COURSES.find(c => c.modules.some(m => m.id === moduleId))
}

/**
 * Курс, активный для данного pathname. Сначала пробуем явную обложку курса
 * (landingHref, кроме "/learn"), затем модуль в URL. Дефолт — первый курс
 * (архитектура), он же покрывает голый "/learn".
 */
export function courseForPath(pathname: string): Course {
  const byLanding = COURSES.find(
    c => c.landingHref !== '/learn' && (pathname === c.landingHref || pathname.startsWith(c.landingHref + '/')),
  )
  if (byLanding) return byLanding

  const match = pathname.match(/^\/learn\/([^/]+)/)
  if (match) {
    const byModule = courseForModule(match[1])
    if (byModule) return byModule
  }
  return COURSES[0]
}

/** Число уроков в курсе — для счётчиков сайдбара/обложки конкретного курса. */
export function courseLessonCount(course: Course): number {
  return course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
}

/** Линейный список уроков для prev/next-навигации — в пределах ОДНОГО курса. */
export function getLessonNeighbours(moduleId: string, slug: string): { prev?: Lesson; next?: Lesson } {
  const course = courseForModule(moduleId)
  const lessons = course ? course.modules.flatMap(m => m.lessons) : ALL_LESSONS
  const idx = lessons.findIndex(l => l.moduleId === moduleId && l.slug === slug)
  if (idx === -1) return {}
  return {
    prev: idx > 0 ? lessons[idx - 1] : undefined,
    next: idx < lessons.length - 1 ? lessons[idx + 1] : undefined,
  }
}

export function lessonHref(lesson: Lesson): string {
  return `/learn/${lesson.moduleId}/${lesson.slug}`
}

export function moduleHref(module: Module): string {
  return `/learn/${module.id}`
}
