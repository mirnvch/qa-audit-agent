'use client'

// Кнопка-гамбургер для открытия CourseSidebar в overlay-режиме на mobile.
// Видна только < lg (≥1024px). Диспатчит событие, которое слушает CourseSidebar.

import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CourseSidebarMobileTrigger({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('course-sidebar:toggle'))}
      aria-label="Открыть меню курса"
      className={cn(
        'inline-flex items-center justify-center rounded-md p-1.5 -ml-1.5',
        'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
        'lg:hidden',
        className,
      )}
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}
