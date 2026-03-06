import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QualityShield — Free Website Audit',
}

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {children}
    </div>
  )
}
