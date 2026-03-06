export const metadata = {
  title: 'Website Audit - QA Camp',
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>
}
