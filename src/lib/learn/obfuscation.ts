// Переключатель режимов 'original' / 'obfuscated' для имён в учебном контенте.
// На текущем этапе это no-op: возвращает текст как есть.
// В будущем тут появится словарь замен (Nexus → TMS-Demo, Tilt → AcmeCorp и т.д.).
// Все рендеры MDX и динамические тексты должны проходить через obfuscate(), чтобы
// потом включение режима стало однострочным изменением.

export type LearnMode = 'original' | 'obfuscated'

export function getLearnMode(): LearnMode {
  // Сначала смотрим на NEXT_PUBLIC_LEARN_MODE (видна и в браузере, и на сервере).
  const fromEnv = process.env.NEXT_PUBLIC_LEARN_MODE
  if (fromEnv === 'obfuscated') return 'obfuscated'
  return 'original'
}

/**
 * Возвращает текст, при необходимости подменив реальные имена на анонимизированные.
 * На сегодня: всегда возвращает оригинал. Сигнатура заморожена для будущего dictionary-режима.
 */
export function obfuscate(text: string, mode: LearnMode = getLearnMode()): string {
  if (mode === 'original') return text
  // TODO: словарь замен. Пример того, как будет:
  // return text.replace(/\bNexus\b/g, 'TMS-Demo').replace(/\bTilt\b/g, 'AcmeCorp')
  return text
}
