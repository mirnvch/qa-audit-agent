# Phase 1: Foundation (Polish & Reliability) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the admin panel from a working demo into a reliable product — zero silent failures, proper loading/error states, pagination, and clean code.

**Architecture:** Install sonner for toasts, add Toaster to root layout, refactor all server actions to return `{error?: string, success?: string}`, add `useActionState` pattern to all client forms, add server-side pagination with `searchParams`, extract shared utilities.

**Tech Stack:** Next.js 16 App Router, Supabase, sonner, shadcn/ui AlertDialog, TypeScript strict

---

### Task 1: Install sonner + add Toaster provider

**Files:**
- Modify: `admin/package.json`
- Modify: `admin/src/app/layout.tsx:28-35`

**Step 1: Install sonner**

Run: `cd /Users/mrnvch/Document/Development/qa-audit-agent/admin && npm install sonner`

**Step 2: Add Toaster to root layout**

In `admin/src/app/layout.tsx`, add import and component:

```tsx
import { Toaster } from 'sonner'
```

Add `<Toaster richColors position="top-right" />` inside `<ThemeProvider>`, after `{children}`:

```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
  {children}
  <Toaster richColors position="top-right" />
</ThemeProvider>
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds, no errors.

**Step 4: Commit**

```bash
git add package.json package-lock.json 'src/app/layout.tsx'
git commit -m "feat: add sonner toast notifications provider"
```

---

### Task 2: Add toasts to template actions (create/update/delete)

**Files:**
- Modify: `admin/src/components/template-form.tsx:27-40`
- Modify: `admin/src/components/template-actions.tsx:19-30`

**Step 1: Add toasts to template-form.tsx**

Import sonner at top:
```tsx
import { toast } from 'sonner'
```

Replace the action handler block (around line 33-40) — after `startTransition` callback resolves:

```tsx
startTransition(async () => {
  const result = await action(formData)
  if (result?.error) {
    toast.error(result.error)
    return
  }
  toast.success(defaultValues ? 'Template updated' : 'Template created')
})
```

**Step 2: Add toast to template delete in template-actions.tsx**

Import sonner:
```tsx
import { toast } from 'sonner'
```

In the delete handler (around line 21-27):
```tsx
const ok = confirm('Delete this template? This action cannot be undone.')
if (!ok) return
const result = await deleteTemplate(templateId)
if (result?.error) {
  toast.error(result.error)
  return
}
toast.success('Template deleted')
```

Note: `deleteTemplate` in `templates/actions.ts` currently returns void. Modify it to return `{error?: string}`:

**Step 3: Fix deleteTemplate action to return errors**

In `admin/src/app/(admin)/templates/actions.ts`, modify `deleteTemplate`:

```tsx
export async function deleteTemplate(id: string): Promise<{ error?: string }> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('email_templates').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/templates')
  return {}
}
```

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add 'src/components/template-form.tsx' 'src/components/template-actions.tsx' 'src/app/(admin)/templates/actions.ts'
git commit -m "feat: add toast notifications to template CRUD actions"
```

---

### Task 3: Add toasts to report actions (mark sent, delete, copy link)

**Files:**
- Modify: `admin/src/app/(admin)/reports/actions.ts:33-59`
- Modify: `admin/src/components/report-actions.tsx:20-35`
- Modify: `admin/src/components/report-detail-actions.tsx:15-35`

**Step 1: Fix report actions to return errors**

In `admin/src/app/(admin)/reports/actions.ts`:

`updateReportStatus` — change catch block to return error:
```tsx
export async function updateReportStatus(reportId: string, status: ReportStatus): Promise<{ error?: string }> {
  try {
    // ... existing code ...
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update status' }
  }
}
```

`deleteReport` — same pattern:
```tsx
export async function deleteReport(reportId: string): Promise<{ error?: string }> {
  try {
    // ... existing code ...
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete report' }
  }
}
```

**Step 2: Add toasts to report-actions.tsx**

Import: `import { toast } from 'sonner'`

In `handleMarkAsSent`:
```tsx
const result = await updateReportStatus(reportId, 'sent')
if (result?.error) {
  toast.error(result.error)
  return
}
toast.success('Report marked as sent')
```

In `handleDelete`:
```tsx
const ok = confirm('Delete this report? This cannot be undone.')
if (!ok) return
const result = await deleteReport(reportId)
if (result?.error) {
  toast.error(result.error)
  return
}
toast.success('Report deleted')
```

**Step 3: Add toast to report-detail-actions.tsx**

Import: `import { toast } from 'sonner'`

For copy link — replace `setCopied` pattern with toast:
```tsx
await navigator.clipboard.writeText(`${window.location.origin}/r/${code}`)
toast.success('Client link copied to clipboard')
```

For mark as sent:
```tsx
const result = await updateReportStatus(reportId, 'sent')
if (result?.error) {
  toast.error(result.error)
  return
}
toast.success('Report marked as sent')
```

Remove `copied` state and related `setTimeout` — this fixes bug B3.

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add 'src/app/(admin)/reports/actions.ts' 'src/components/report-actions.tsx' 'src/components/report-detail-actions.tsx'
git commit -m "feat: add toast notifications to report actions, fix B3 timeout bug"
```

---

### Task 4: Add toasts to scan creation and password change

**Files:**
- Modify: `admin/src/components/new-scan-dialog.tsx:25-35`
- Modify: `admin/src/components/password-form.tsx:25-40`

**Step 1: Add toast to new-scan-dialog.tsx**

Import: `import { toast } from 'sonner'`

In the submit handler:
```tsx
const result = await createScanRequest(formData)
if (result.error) {
  toast.error(result.error)
  return
}
toast.success('Scan request created')
setOpen(false)
```

**Step 2: Add toast to password-form.tsx**

Import: `import { toast } from 'sonner'`

Replace the manual success/error state with toasts:
```tsx
const result = await changePassword(newPassword)
if (result.error) {
  toast.error(result.error)
} else {
  toast.success('Password updated successfully')
  setNewPassword('')
  setConfirmPassword('')
}
setLoading(false)
```

Remove `error` and `success` useState variables and their JSX rendering — toasts handle this now.

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add 'src/components/new-scan-dialog.tsx' 'src/components/password-form.tsx'
git commit -m "feat: add toast notifications to scan creation and password change"
```

---

### Task 5: Fix bug B1 — template form "Saving..." stuck on error

**Files:**
- Modify: `admin/src/components/template-form.tsx:30-40`

**Step 1: Verify bug exists**

The `startTransition` from `useTransition` should automatically set `isPending` back to false when the async function resolves or rejects. But if `action()` calls `redirect()` inside (which `createTemplate` and `updateTemplate` do on success), the transition stays pending because redirect throws.

The real fix: if the action returns an error, isPending resets automatically. If action succeeds, redirect happens. So the "stuck" case is when the action throws unexpectedly.

Wrap the action call in try/catch inside startTransition:

```tsx
startTransition(async () => {
  try {
    const result = await action(formData)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success(defaultValues ? 'Template updated' : 'Template created')
  } catch {
    toast.error('An unexpected error occurred')
  }
})
```

This was partially done in Task 2. Verify the try/catch is present.

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit (if changes needed)**

```bash
git add 'src/components/template-form.tsx'
git commit -m "fix: handle unexpected errors in template form (B1)"
```

---

### Task 6: Fix bug B2 — scan status polling cleanup

**Files:**
- Modify: `admin/src/app/scan/status/[id]/page.tsx:35-44`

**Step 1: Read the current polling code**

Read file to verify exact line numbers.

**Step 2: Verify cleanup is present**

The agent report says interval is cleared on line 43 (`clearInterval`). Verify the useEffect returns a cleanup function. If it does, B2 may already be fixed. If not, add:

```tsx
useEffect(() => {
  if (status === 'completed' || status === 'failed') return

  const interval = setInterval(poll, 8000)
  return () => clearInterval(interval)
}, [status, poll])
```

Also add a max poll count to prevent infinite polling:

```tsx
const [pollCount, setPollCount] = useState(0)
const MAX_POLLS = 150 // 150 * 8s = 20 minutes

useEffect(() => {
  if (status === 'completed' || status === 'failed') return
  if (pollCount >= MAX_POLLS) return

  const interval = setInterval(() => {
    setPollCount(c => c + 1)
    poll()
  }, 8000)
  return () => clearInterval(interval)
}, [status, poll, pollCount])
```

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add 'src/app/scan/status/[id]/page.tsx'
git commit -m "fix: add polling cleanup and max poll limit (B2)"
```

---

### Task 7: Add confirmation dialogs for destructive actions

**Files:**
- Modify: `admin/src/components/report-actions.tsx`
- Modify: `admin/src/components/template-actions.tsx`

**Step 1: Install AlertDialog from shadcn**

Run: `cd /Users/mrnvch/Document/Development/qa-audit-agent/admin && npx shadcn@latest add alert-dialog`

**Step 2: Replace confirm() with AlertDialog in template-actions.tsx**

Replace the native `confirm()` call with a proper shadcn AlertDialog:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteTemplate } from '@/app/(admin)/templates/actions'

export function TemplateActions({ templateId }: { templateId: string }) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)

  async function handleDelete() {
    const result = await deleteTemplate(templateId)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success('Template deleted')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/templates/${templateId}/edit`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-400"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The template will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

**Step 3: Apply same pattern to report-actions.tsx**

Replace `confirm()` in delete handler with AlertDialog. Same structure as above but for `deleteReport`.

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add 'src/components/ui/alert-dialog.tsx' 'src/components/template-actions.tsx' 'src/components/report-actions.tsx'
git commit -m "feat: replace confirm() with AlertDialog for destructive actions"
```

---

### Task 8: Add pagination + search to Reports page

**Files:**
- Modify: `admin/src/app/(admin)/reports/page.tsx`

**Step 1: Add searchParams for pagination and search**

The page already receives `searchParams` with `status`. Extend to include `page` and `q`:

```tsx
type Props = {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>
}
```

**Step 2: Modify getReports to support pagination + search**

```tsx
const PAGE_SIZE = 20

async function getReports(statusFilter: string, page: number, query: string) {
  // ... env check ...
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let q = supabase
    .from('reports')
    .select('*, companies(*), findings(severity)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (statusFilter !== 'all') {
    q = q.eq('status', statusFilter)
  }

  if (query) {
    q = q.or(`code.ilike.%${query}%,companies.name.ilike.%${query}%,companies.domain.ilike.%${query}%`)
  }

  const { data, error, count } = await q
  if (error) throw error

  return {
    reports: (data ?? []) as ReportWithCompany[],
    total: count ?? 0,
  }
}
```

**Step 3: Add search input and pagination controls to JSX**

Add a search input before the table:

```tsx
<div className="flex items-center gap-4">
  <form className="relative flex-1 max-w-sm">
    <input
      name="q"
      defaultValue={query}
      placeholder="Search reports..."
      className="w-full h-9 rounded-md border border-border/50 bg-muted/20 px-3 text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring"
    />
  </form>
</div>
```

Add pagination after table:

```tsx
{total > PAGE_SIZE && (
  <div className="flex items-center justify-between px-2 pt-4">
    <p className="text-xs text-muted-foreground font-mono">
      Showing {from + 1}-{Math.min(to + 1, total)} of {total}
    </p>
    <div className="flex gap-2">
      {page > 1 && (
        <Link
          href={`/reports?status=${statusFilter}&page=${page - 1}${query ? `&q=${query}` : ''}`}
          className="px-3 py-1.5 rounded-md text-xs font-mono border border-border/50 hover:bg-muted/30"
        >
          Previous
        </Link>
      )}
      {to + 1 < total && (
        <Link
          href={`/reports?status=${statusFilter}&page=${page + 1}${query ? `&q=${query}` : ''}`}
          className="px-3 py-1.5 rounded-md text-xs font-mono border border-border/50 hover:bg-muted/30"
        >
          Next
        </Link>
      )}
    </div>
  </div>
)}
```

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add 'src/app/(admin)/reports/page.tsx'
git commit -m "feat: add pagination and search to Reports page"
```

---

### Task 9: Add pagination to Leads, Scans, Templates pages

**Files:**
- Modify: `admin/src/app/(admin)/leads/page.tsx`
- Modify: `admin/src/app/(admin)/scans/page.tsx`
- Modify: `admin/src/app/(admin)/templates/page.tsx`

**Step 1: Apply same pagination pattern to Scans page**

Same approach as Task 8: add `page` searchParam, `.range(from, to)`, `{ count: 'exact' }`, pagination controls.

**Step 2: Apply pagination to Leads page**

Leads computes status client-side, so paginate after filtering:
- Fetch all companies (Supabase doesn't support computed column filter)
- Compute lead statuses in JS
- Apply status filter
- Slice for pagination: `leads.slice(from, to + 1)`
- Show total from filtered array

**Step 3: Apply pagination to Templates page**

Same pattern as Scans — simpler since no status filter, just `.range()`.

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add 'src/app/(admin)/leads/page.tsx' 'src/app/(admin)/scans/page.tsx' 'src/app/(admin)/templates/page.tsx'
git commit -m "feat: add pagination to Leads, Scans, and Templates pages"
```

---

### Task 10: Replace mock data fallbacks with empty states

**Files:**
- Modify: `admin/src/app/(admin)/dashboard/page.tsx:39-52`
- Modify: `admin/src/app/(admin)/layout.tsx` (Quick Stats fallback)

**Step 1: Replace dashboard mock data with zeros**

In `dashboard/page.tsx`, replace the catch block mock data with zeros + a warning flag:

```tsx
} catch {
  return {
    stats: { scanned: 0, sent: 0, viewed: 0, replied: 0, conversion: 0 },
    funnel: { scanned: 0, emailSent: 0, viewed: 0, replied: 0, converted: 0 },
    activities: [],
    isOffline: true,
  }
}
```

Add a banner at top of dashboard when `isOffline`:

```tsx
{isOffline && (
  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
    <p className="text-sm text-amber-400 font-mono">
      Unable to connect to database. Showing empty state.
    </p>
  </div>
)}
```

**Step 2: Replace admin layout Quick Stats mock with zeros**

In `app/(admin)/layout.tsx`, catch block should return zeros instead of fake numbers.

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add 'src/app/(admin)/dashboard/page.tsx' 'src/app/(admin)/layout.tsx'
git commit -m "feat: replace mock data fallbacks with empty states and offline banner"
```

---

### Task 11: Extract shared utilities and fix types

**Files:**
- Create: `admin/src/lib/format.ts`
- Modify: `admin/src/app/(admin)/scans/page.tsx`
- Modify: `admin/src/app/(admin)/templates/page.tsx`
- Modify: `admin/src/app/(admin)/reports/actions.ts`

**Step 1: Create shared format utility**

```tsx
// admin/src/lib/format.ts

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeDate(dateStr: string) {
  const now = new Date()
  const then = new Date(dateStr)
  const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}
```

**Step 2: Replace duplicated formatDate in scans and templates pages**

In both files, replace local `formatDate()` with:
```tsx
import { formatDate } from '@/lib/format'
```

Remove the local function definitions.

**Step 3: Fix untyped Supabase client in reports/actions.ts**

Replace `getRawClient()` workaround with properly typed client. Read the current implementation and use `createClient()` from `@/lib/supabase/server` with type assertions where needed, instead of creating a separate untyped client.

**Step 4: Verify build**

Run: `npm run build`

**Step 5: Commit**

```bash
git add src/lib/format.ts 'src/app/(admin)/scans/page.tsx' 'src/app/(admin)/templates/page.tsx' 'src/app/(admin)/reports/actions.ts'
git commit -m "refactor: extract shared utils, fix duplicated code (B5, B6)"
```

---

### Task 12: Add loading states with Suspense

**Files:**
- Create: `admin/src/app/(admin)/reports/loading.tsx`
- Create: `admin/src/app/(admin)/leads/loading.tsx`
- Create: `admin/src/app/(admin)/scans/loading.tsx`
- Create: `admin/src/app/(admin)/templates/loading.tsx`
- Create: `admin/src/app/(admin)/dashboard/loading.tsx`

**Step 1: Create a reusable skeleton pattern**

Each `loading.tsx` file exports a default component that mirrors the page layout with animated placeholders. Example for reports:

```tsx
export default function ReportsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-8 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="h-3 w-48 bg-muted/40 rounded mb-2" />
          <div className="h-8 w-32 bg-muted/40 rounded" />
        </div>
        <div className="h-9 w-80 bg-muted/40 rounded" />
      </div>
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="h-10 bg-muted/20 border-b border-border/50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-border/50 flex items-center px-4 gap-4">
            <div className="h-4 w-20 bg-muted/30 rounded" />
            <div className="h-4 w-32 bg-muted/30 rounded" />
            <div className="h-4 w-24 bg-muted/30 rounded" />
            <div className="h-4 w-16 bg-muted/30 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Create similar loading files for other pages**

Dashboard: stat card skeletons + funnel skeleton
Leads: same table skeleton pattern
Scans: same table skeleton pattern
Templates: same table skeleton pattern

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add 'src/app/(admin)/reports/loading.tsx' 'src/app/(admin)/leads/loading.tsx' 'src/app/(admin)/scans/loading.tsx' 'src/app/(admin)/templates/loading.tsx' 'src/app/(admin)/dashboard/loading.tsx'
git commit -m "feat: add loading skeletons for all admin pages"
```

---

### Task 13: Final verification and push

**Step 1: Full build check**

Run: `npm run build`
Expected: All pages build successfully.

**Step 2: Git status check**

Run: `git status`
Expected: Clean working tree.

**Step 3: Push all Phase 1 commits**

Run: `git push`

---

## Summary

| Task | Description | Bugs Fixed |
|------|-------------|------------|
| 1 | Install sonner + Toaster provider | — |
| 2 | Toast on template CRUD | — |
| 3 | Toast on report actions | B3 |
| 4 | Toast on scan + password | — |
| 5 | Fix template form stuck state | B1 |
| 6 | Fix polling cleanup + max limit | B2 |
| 7 | AlertDialog for destructive actions | — |
| 8 | Pagination + search: Reports | — |
| 9 | Pagination: Leads, Scans, Templates | — |
| 10 | Replace mock data with empty states | B4 |
| 11 | Extract shared utils, fix types | B5, B6, B7 |
| 12 | Loading skeletons for all pages | — |
| 13 | Final verify + push | — |

**All 7 bugs (B1-B7) fixed. All Phase 1 tasks (1.1-1.7) covered.**
