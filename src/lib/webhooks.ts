import { createServiceClient } from '@/lib/supabase/service'

export async function fireWebhooks(event: string, payload: Record<string, unknown>) {
  try {
    const supabase = createServiceClient()
    const { data: hooks } = await supabase
      .from('webhooks')
      .select('url')
      .eq('active', true)
      .contains('events', [event])

    if (!hooks || hooks.length === 0) return

    await Promise.allSettled(
      hooks.map(hook =>
        fetch(hook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() }),
        })
      )
    )
  } catch {
    // Silent — webhook failures shouldn't break main flow
  }
}
