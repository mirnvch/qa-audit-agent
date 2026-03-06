'use client'

import { useTheme } from 'next-themes'

const themes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-2">
      {themes.map((t) => {
        const isActive = theme === t.value
        return (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium tracking-wide transition-colors ${
              isActive
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-border/50'
            }`}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
