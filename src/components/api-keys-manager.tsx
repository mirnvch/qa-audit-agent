'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { createApiKey, deleteApiKey } from '@/app/(admin)/settings/api-keys-action'
import { createClient } from '@/lib/supabase/client'
import type { ApiKey } from '@/lib/supabase/types'
import { toast } from 'sonner'
import { Plus, Trash2, Copy, Check, Key } from 'lucide-react'

function maskKey(key: string): string {
  if (key.length <= 8) return key
  return `${key.slice(0, 3)}...${key.slice(-4)}`
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchKeys = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false })
    setKeys((data as ApiKey[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    const result = await createApiKey(name)
    setCreating(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setNewKey(result.key ?? null)
    setName('')
    fetchKeys()
  }

  async function handleDelete(id: string) {
    const result = await deleteApiKey(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('API key deleted')
    fetchKeys()
  }

  async function handleCopy() {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      setNewKey(null)
      setName('')
    }
    setDialogOpen(open)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            API keys allow external services to authenticate with your API.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="size-4 mr-1" />
              Generate Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            {newKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy this key now. You won&apos;t be able to see it again.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-xs break-all">
                    {newKey}
                  </code>
                  <Button size="icon" variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={() => handleDialogClose(false)}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Generate API Key</DialogTitle>
                  <DialogDescription>
                    Give this key a name to identify it later.
                  </DialogDescription>
                </DialogHeader>
                <Input
                  placeholder="e.g. Production, CI/CD, Testing"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={!name.trim() || creating}>
                    {creating ? 'Creating...' : 'Generate'}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Key className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No API keys yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map(k => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{k.name}</p>
                <p className="text-xs font-mono text-muted-foreground">{maskKey(k.key)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(k.created_at).toLocaleDateString()}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="size-8 text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately revoke the key &quot;{k.name}&quot;. Any services using it will stop working.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(k.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
