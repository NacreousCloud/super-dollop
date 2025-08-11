import { Cake } from 'lucide-react';

export function Header() {
  return (
    <div className="flex items-center gap-2 p-3 border-b bg-background">
      <div className="flex items-center gap-2">
        <Cake className="w-5 h-5 text-primary" strokeWidth={1.5} />
        <h1 className="text-base font-semibold">Cake</h1>
      </div>
      <div className="flex-1" />
      <div className="text-xs text-muted-foreground">E2E Testing Tool</div>
    </div>
  );
}