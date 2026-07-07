type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type RequestOpenRouterChatOptions = {
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
  responseFormat?: { type: 'json_object' }
}

export type OpenRouterChatResult = {
  content: string
  model: string
}

export class OpenRouterRequestError extends Error {
  status: number

  constructor(message: string, status = 502) {
    super(message)
    this.name = 'OpenRouterRequestError'
    this.status = status
  }
}

const DEFAULT_MODEL = 'anthropic/claude-sonnet-5'

function getModel() {
  return process.env.ASK_CLAUDE_MODEL ?? DEFAULT_MODEL
}

function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.SITE_URL) return process.env.SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

function getErrorMessage(status: number, upstreamMessage?: string) {
  if (status === 401 || status === 403) {
    return 'OpenRouter отклонил API key. Проверь OPENROUTER_API_KEY на сервере.'
  }
  if (status === 429) {
    return 'Дневной лимит бесплатных запросов исчерпан. Попробуй завтра или переключи модель на платную.'
  }
  if (upstreamMessage) {
    return `OpenRouter вернул ошибку: ${upstreamMessage}`
  }
  return 'Сервис ответов сейчас недоступен, попробуй ещё раз чуть позже.'
}

async function readUpstreamError(response: Response) {
  const text = await response.text().catch(() => '')
  if (!text) return null

  try {
    const data = JSON.parse(text)
    const message = data?.error?.message ?? data?.message
    return typeof message === 'string' ? message : text.slice(0, 300)
  } catch {
    return text.slice(0, 300)
  }
}

export async function requestOpenRouterChat({
  messages,
  maxTokens = 1200,
  temperature = 0.2,
  responseFormat,
}: RequestOpenRouterChatOptions): Promise<OpenRouterChatResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new OpenRouterRequestError('OPENROUTER_API_KEY не настроен на сервере.', 500)
  }

  const model = getModel()
  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': getAppUrl(),
      'X-OpenRouter-Title': 'QA Architecture Course',
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  }).catch(() => null)

  if (!upstream) {
    throw new OpenRouterRequestError('Сеть до OpenRouter недоступна, попробуй ещё раз чуть позже.')
  }

  if (!upstream.ok) {
    const upstreamMessage = await readUpstreamError(upstream)
    throw new OpenRouterRequestError(getErrorMessage(upstream.status, upstreamMessage ?? undefined), 502)
  }

  const data = await upstream.json().catch(() => null)
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new OpenRouterRequestError('Модель вернула пустой ответ, попробуй переформулировать вопрос.')
  }

  return { content: content.trim(), model }
}
