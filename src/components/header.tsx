import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header() {
  return (
    <header className="h-14 border-b border-border/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm tracking-tight">QACAMP</span>
        <span className="text-muted-foreground/40">|</span>
        <span className="text-xs font-mono text-muted-foreground tracking-wider">
          REPORT PORTAL · ADMIN
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs font-mono text-muted-foreground">REV. 1.0</span>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-muted">M</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
