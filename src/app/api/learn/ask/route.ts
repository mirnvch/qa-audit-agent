import { NextRequest, NextResponse } from 'next/server'
import { OpenRouterRequestError, requestOpenRouterChat } from '@/lib/learn/openrouter'

// «Спросить Claude» в уроках: сервер-прокси к OpenRouter (OpenAI-совместимый chat API).
// Ключ живёт ТОЛЬКО здесь, на сервере (admin/.env.local + env Vercel) — в браузер не попадает.
// Маршрут закрыт логином: /api/learn/* не входит в исключения middleware.
//
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

  try {
    const result = await requestOpenRouterChat({
      messages: [
        {
          role: 'system',
          content: context ? `${SYSTEM_PROMPT}\n\nУченик сейчас читает: ${context}.` : SYSTEM_PROMPT,
        },
        { role: 'user', content: question },
      ],
      maxTokens: 1200,
      temperature: 0.2,
    })
    return NextResponse.json({ answer: result.content, model: result.model })
  } catch (error) {
    if (error instanceof OpenRouterRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json(
      { error: 'Сервис ответов сейчас недоступен, попробуй ещё раз чуть позже.' },
      { status: 502 },
    )
  }
}
