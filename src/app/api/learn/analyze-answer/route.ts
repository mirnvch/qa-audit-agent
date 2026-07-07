import { NextRequest, NextResponse } from 'next/server'
import { OpenRouterRequestError, requestOpenRouterChat } from '@/lib/learn/openrouter'

const MAX_PROMPT_CHARS = 8000
const MAX_ANSWER_CHARS = 8000
const MAX_CONTEXT_CHARS = 400
const MAX_ANSWER_KEY_CHARS = 12000

const SYSTEM_PROMPT = [
  'Ты — строгий, но спокойный проверяющий курса по архитектуре тест-автоматизации для QA-инженера.',
  'Разбирай только ответ ученика на конкретное задание. Не придумывай то, чего ученик не написал.',
  'Сравнивай ответ с текстом задания и эталонным разбором, если он передан.',
  'Если в задании есть формальное условие вроде "минимум 3 признака", явно проверь количество отдельных засчитываемых пунктов.',
  'Не ставь scoreLabel "ok", если формальное условие не выполнено. "strong" ставь только когда покрыты ключевые критерии.',
  'summary — одно короткое предложение с вердиктом по существу, без JSON, markdown и технического мусора.',
  'strengths — только то, что реально можно зачесть из ответа ученика.',
  'gaps — что отсутствует, неточно или не засчитывается как отдельный пункт.',
  'corrections — как правильно сформулировать ошибочные мысли ученика.',
  'nextSteps — готовые конкретные пункты, которые ученик может дописать в свой ответ. Не пиши "сравни с эталоном".',
  'Верни только валидный JSON-объект без markdown и без текста вокруг.',
  'Схема JSON: { "summary": string, "scoreLabel": "strong" | "ok" | "needs_work", "strengths": string[], "gaps": string[], "corrections": string[], "nextSteps": string[] }.',
  'В каждом массиве верни 1-3 коротких пункта. Пиши по-русски. Технические термины оставляй на английском.',
].join(' ')

const REPAIR_SYSTEM_PROMPT = [
  'Предыдущий ответ модели был невалидным.',
  'Сгенерируй заново короткий разбор ответа ученика.',
  'Верни только валидный JSON-объект по схеме:',
  '{ "summary": string, "scoreLabel": "strong" | "ok" | "needs_work", "strengths": string[], "gaps": string[], "corrections": string[], "nextSteps": string[] }.',
  'Никакого markdown, code fence, текста до или после JSON.',
].join(' ')

type Feedback = {
  summary: string
  scoreLabel: 'strong' | 'ok' | 'needs_work'
  strengths: string[]
  gaps: string[]
  corrections: string[]
  nextSteps: string[]
}

function asTrimmedString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => asTrimmedString(item))
    .filter(Boolean)
    .slice(0, 3)
}

function normalizeScoreLabel(value: unknown): Feedback['scoreLabel'] {
  return value === 'strong' || value === 'needs_work' ? value : 'ok'
}

function stripCodeFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function findBalancedJsonObject(text: string) {
  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
    } else if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, i + 1)
    }
  }

  return null
}

function parseJsonValue(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function extractJsonObject(text: string) {
  const stripped = stripCodeFence(text)
  const direct = parseJsonValue(stripped)
  if (typeof direct === 'string') {
    return extractJsonObject(direct)
  }
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    return direct
  }

  const balanced = findBalancedJsonObject(stripped)
  if (!balanced) return null

  const parsed = parseJsonValue(balanced)
  if (typeof parsed === 'string') {
    return extractJsonObject(parsed)
  }
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
}

function normalizeFeedback(rawText: string): Feedback | null {
  const parsed = extractJsonObject(rawText)
  if (!parsed || typeof parsed !== 'object') return null

  const summary =
    asTrimmedString((parsed as { summary?: unknown }).summary) ||
    'Разбор готов. Сравни сильные стороны и пробелы ниже.'

  return {
    summary,
    scoreLabel: normalizeScoreLabel((parsed as { scoreLabel?: unknown }).scoreLabel),
    strengths: asStringArray((parsed as { strengths?: unknown }).strengths),
    gaps: asStringArray((parsed as { gaps?: unknown }).gaps),
    corrections: asStringArray((parsed as { corrections?: unknown }).corrections),
    nextSteps: asStringArray((parsed as { nextSteps?: unknown }).nextSteps),
  }
}

function buildUserPrompt({
  lessonId,
  exerciseId,
  context,
  prompt,
  answer,
  answerKey,
}: {
  lessonId: string
  exerciseId: string
  context: string
  prompt: string
  answer: string
  answerKey: string
}) {
  return [
    `Контекст курса: ${context || 'не указан'}`,
    `Урок: ${lessonId || 'не указан'}`,
    `Задание: ${exerciseId || 'не указано'}`,
    '',
    'Текст задания:',
    prompt,
    '',
    'Эталонный разбор / критерии проверки:',
    answerKey || 'Эталон не передан. Проверяй только по тексту задания.',
    '',
    'Ответ ученика:',
    answer,
  ].join('\n')
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const lessonId = asTrimmedString(body?.lessonId).slice(0, 80)
  const exerciseId = asTrimmedString(body?.exerciseId).slice(0, 80)
  const context = asTrimmedString(body?.context).slice(0, MAX_CONTEXT_CHARS)
  const prompt = asTrimmedString(body?.prompt).slice(0, MAX_PROMPT_CHARS)
  const answer = asTrimmedString(body?.answer).slice(0, MAX_ANSWER_CHARS)
  const answerKey = asTrimmedString(body?.answerKey).slice(0, MAX_ANSWER_KEY_CHARS)

  if (!prompt) {
    return NextResponse.json({ error: 'Текст задания пустой.' }, { status: 400 })
  }
  if (!answer) {
    return NextResponse.json({ error: 'Ответ пустой.' }, { status: 400 })
  }

  try {
    const userPrompt = buildUserPrompt({ lessonId, exerciseId, context, prompt, answer, answerKey })
    const result = await requestOpenRouterChat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 2200,
      temperature: 0.15,
      responseFormat: { type: 'json_object' },
    })

    const feedback = normalizeFeedback(result.content)
    if (feedback) {
      return NextResponse.json({ feedback, model: result.model })
    }

    const repaired = await requestOpenRouterChat({
      messages: [
        { role: 'system', content: REPAIR_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      maxTokens: 1400,
      temperature: 0,
      responseFormat: { type: 'json_object' },
    })

    const repairedFeedback = normalizeFeedback(repaired.content)
    if (repairedFeedback) {
      return NextResponse.json({ feedback: repairedFeedback, model: repaired.model })
    }

    return NextResponse.json(
      { error: 'AI вернул некорректный формат разбора. Нажми «Обновить разбор» ещё раз.' },
      { status: 502 },
    )
  } catch (error) {
    if (error instanceof OpenRouterRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { error: 'AI-разбор сейчас недоступен, попробуй ещё раз чуть позже.' },
      { status: 502 },
    )
  }
}
