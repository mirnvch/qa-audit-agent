import { NextRequest, NextResponse } from 'next/server'

// «Спросить Claude» в уроках: сервер-прокси к OpenRouter (OpenAI-совместимый chat API).
// Ключ живёт ТОЛЬКО здесь, на сервере (admin/.env.local + env Vercel) — в браузер не попадает.
// Маршрут закрыт логином: /api/learn/* не входит в исключения middleware.
//
// Модель меняется без правки кода: ASK_CLAUDE_MODEL в .env.local.
// Старт — бесплатная (лимит OpenRouter ~50 запросов/день без кредитов);
// апгрейд качества: ASK_CLAUDE_MODEL=anthropic/claude-haiku-4.5 (нужны кредиты).
const MODEL = process.env.ASK_CLAUDE_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b:free'

const MAX_QUESTION_CHARS = 4000

const SYSTEM_PROMPT = [
  'Ты — наставник учебного курса по архитектуре тест-автоматизации проекта Nexus:',
  'Playwright (UI) + Vitest (API), TypeScript strict, Page Object Model с инструментированными',
  'обёртками, GraphQL-клиент с доменными модулями, фабрики тест-данных (Fishery + Faker),',
  'зеро-траст политика ассертов. Ученик — QA-инженер, изучающий устройство своего фреймворка.',
  'Отвечай по-русски, дружелюбно и кратко (обычно 2-6 абзацев), с примерами кода где уместно.',
  'Технические термины оставляй на английском. Если вопрос выходит за рамки курса — скажи об',
  'этом честно и ответь настолько, насколько можешь.',
].join(' ')

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY не настроен на сервере.' },
      { status: 500 }
    )
  }

  const body = await request.json().catch(() => null)
  const question = typeof body?.question === 'string' ? body.question.trim() : ''
  // Метка места в курсе ("part-2" + pathname урока) — уходит в систем-контекст, не в вопрос.
  const context = typeof body?.context === 'string' ? body.context.slice(0, 300) : ''

  if (!question) {
    return NextResponse.json({ error: 'Пустой вопрос.' }, { status: 400 })
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return NextResponse.json(
      { error: `Вопрос слишком длинный (лимит ${MAX_QUESTION_CHARS} символов).` },
      { status: 400 }
    )
  }

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: context ? `${SYSTEM_PROMPT}\n\nУченик сейчас читает: ${context}.` : SYSTEM_PROMPT,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 1200,
    }),
  }).catch(() => null)

  if (!upstream || !upstream.ok) {
    const status = upstream?.status ?? 502
    // 429 у бесплатных моделей = дневной лимит OpenRouter исчерпан.
    const reason =
      status === 429
        ? 'Дневной лимит бесплатных запросов исчерпан — попробуй завтра или переключи модель на платную.'
        : 'Сервис ответов сейчас недоступен, попробуй ещё раз чуть позже.'
    return NextResponse.json({ error: reason }, { status: 502 })
  }

  const data = await upstream.json().catch(() => null)
  const answer = data?.choices?.[0]?.message?.content
  if (typeof answer !== 'string' || !answer.trim()) {
    return NextResponse.json(
      { error: 'Модель вернула пустой ответ, попробуй переформулировать вопрос.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ answer: answer.trim(), model: MODEL })
}
