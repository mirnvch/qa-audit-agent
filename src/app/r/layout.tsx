import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'QualityShield — View Report',
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {children}
    </div>
  )
}
