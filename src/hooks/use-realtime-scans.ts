'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ScanRequest } from '@/lib/supabase/types'

export function useRealtimeScans(initialScans: ScanRequest[]) {
  const [scans, setScans] = useState(initialScans)

  useEffect(() => {
    setScans(initialScans)
  }, [initialScans])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('scan-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scan_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setScans(prev => [payload.new as ScanRequest, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setScans(prev =>
              prev.map(s => s.id === (payload.new as ScanRequest).id ? payload.new as ScanRequest : s)
            )
          } else if (payload.eventType === 'DELETE') {
            setScans(prev => prev.filter(s => s.id !== (payload.old as { id: string }).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return scans
}
