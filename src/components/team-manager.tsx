'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { UserRole, UserRoleEntry } from '@/lib/supabase/types'
import { updateUserRole } from '@/app/(admin)/settings/team-action'
import { toast } from 'sonner'
import { Users } from 'lucide-react'

type TeamMember = {
  user_id: string
  role: UserRole
  created_at: string
  email?: string
}

export function TeamManager({ currentUserId }: { currentUserId: string }) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMembers = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: true })

    const rows = (data ?? []) as UserRoleEntry[]
    setMembers(
      rows.map(d => ({
        user_id: d.user_id,
        role: d.role as UserRole,
        created_at: d.created_at,
      }))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  async function handleRoleChange(userId: string, role: UserRole) {
    const result = await updateUserRole(userId, role)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Role updated')
    setMembers(prev =>
      prev.map(m => (m.user_id === userId ? { ...m, role } : m))
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Invite team members by sharing the login URL. Set their role below.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No team members configured</p>
          <p className="text-xs text-muted-foreground mt-1">
            The first user defaults to admin role.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map(m => (
            <div
              key={m.user_id}
              className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-mono">{m.user_id.slice(0, 8)}...</p>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {m.user_id === currentUserId ? (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {m.role} (you)
                  </span>
                ) : (
                  <Select
                    value={m.role}
                    onValueChange={(v: UserRole) => handleRoleChange(m.user_id, v)}
                  >
                    <SelectTrigger className="w-[120px]" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="operator">Operator</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-3">
        <p className="text-xs text-muted-foreground">
          <strong>Admin</strong> — Full access, settings, team management<br />
          <strong>Operator</strong> — Can manage reports, send emails<br />
          <strong>Viewer</strong> — Read-only access
        </p>
      </div>
    </div>
  )
}
