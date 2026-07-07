import { NextRequest, NextResponse } from 'next/server'
import { OpenRouterRequestError, requestOpenRouterChat } from '@/lib/learn/openrouter'

const MAX_PROMPT_CHARS = 8000
const MAX_ANSWER_CHARS = 8000
const MAX_CONTEXT_CHARS = 400

const SYSTEM_PROMPT = [
  'Ты — наставник курса по архитектуре тест-автоматизации для QA-инженера.',
  'Твоя задача — разобрать свободный ответ ученика на задание из курса.',
  'Оценивай не стиль письма, а инженерное мышление: понимание домена, слоёв, границ ответственности,',
  'инвариантов, тестовой пирамиды, Page Object Model, данных, авторизации и zero-trust подхода.',
  'Если задание рефлексивное и не имеет одного правильного ответа, оцени полноту, конкретность и практический план.',
  'Если ученик ошибся, объясняй спокойно и конкретно: что именно неверно, почему, и как исправить мысль.',
  'Верни только JSON без markdown и без текста вокруг.',
  'Схема JSON: { "summary": string, "scoreLabel": "strong" | "ok" | "needs_work",',
  '"strengths": string[], "gaps": string[], "corrections": string[], "nextSteps": string[] }.',
  'В каждом массиве верни 1-4 коротких пункта. Пиши по-русски. Технические термины оставляй на английском.',
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
    .slice(0, 4)
}

function normalizeScoreLabel(value: unknown): Feedback['scoreLabel'] {
  return value === 'strong' || value === 'needs_work' ? value : 'ok'
}

function extractJsonObject(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {
      return null
    }
  }
}

function normalizeFeedback(rawText: string): Feedback {
  const parsed = extractJsonObject(rawText)
  if (!parsed || typeof parsed !== 'object') {
    return {
      summary: rawText.slice(0, 1200),
      scoreLabel: 'ok',
      strengths: [],
      gaps: [],
      corrections: [],
      nextSteps: ['Сравни свой ответ с эталонным разбором ниже и допиши недостающие конкретные проверки.'],
    }
  }

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

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const lessonId = asTrimmedString(body?.lessonId).slice(0, 80)
  const exerciseId = asTrimmedString(body?.exerciseId).slice(0, 80)
  const context = asTrimmedString(body?.context).slice(0, MAX_CONTEXT_CHARS)
  const prompt = asTrimmedString(body?.prompt).slice(0, MAX_PROMPT_CHARS)
  const answer = asTrimmedString(body?.answer).slice(0, MAX_ANSWER_CHARS)

  if (!prompt) {
    return NextResponse.json({ error: 'Текст задания пустой.' }, { status: 400 })
  }
  if (!answer) {
    return NextResponse.json({ error: 'Ответ пустой.' }, { status: 400 })
  }

  try {
    const result = await requestOpenRouterChat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            `Контекст курса: ${context || 'не указан'}`,
            `Урок: ${lessonId || 'не указан'}`,
            `Задание: ${exerciseId || 'не указано'}`,
            '',
            'Текст задания:',
            prompt,
            '',
            'Ответ ученика:',
            answer,
          ].join('\n'),
        },
      ],
      maxTokens: 1400,
      temperature: 0.15,
      responseFormat: { type: 'json_object' },
    })

    return NextResponse.json({ feedback: normalizeFeedback(result.content), model: result.model })
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
