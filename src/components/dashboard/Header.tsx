import { Recycle } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl gradient-primary">
            <Recycle className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SmartBin</h1>
            <p className="text-xs text-muted-foreground">IoT Waste Management</p>
          </div>
        </div>
      </div>
    </header>
  );
}
