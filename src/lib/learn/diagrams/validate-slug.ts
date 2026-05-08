// Slug-правила синхронизированы с CHECK в миграции:
// CHECK (slug ~ '^[a-z0-9][a-z0-9-]*$') + до 100 символов для здравого смысла.

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/
const MAX_LEN = 100

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_LEN && SLUG_RE.test(slug)
}

/** Нормализует произвольную строку в валидный slug-кандидат. */
export function suggestSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')              // убираем диакритику
    .replace(/[^a-z0-9]+/g, '-')                  // не-латиница и не-цифры → дефис
    .replace(/^-+|-+$/g, '')                      // отрезаем дефисы по краям
    .slice(0, MAX_LEN)
}

export function slugError(slug: string): string | null {
  if (!slug) return 'Введи slug'
  if (slug.length > MAX_LEN) return `Slug длиннее ${MAX_LEN} символов`
  if (!SLUG_RE.test(slug)) return 'Только латиница нижнего регистра, цифры и дефис; начинается с буквы или цифры'
  return null
}
