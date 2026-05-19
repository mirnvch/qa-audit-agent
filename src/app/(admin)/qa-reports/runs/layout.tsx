import type { ReactNode } from 'react'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'

// Scoped typography for the /qa-reports/runs subtree only. Existing admin
// pages keep their default Geist font stack. CSS variables are consumed by
// per-component inline `style={{ fontFamily: 'var(--font-...)' }}` overrides.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const jbMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jb-mono',
  display: 'swap',
})

export default function QaRunsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${inter.variable} ${jbMono.variable}`}>
      {children}
    </div>
  )
}
