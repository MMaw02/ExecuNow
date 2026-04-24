import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../shared/lib/cn.ts";

type AppShellProps = {
  isSessionMode: boolean;
  isSidebarCollapsed: boolean;
  sidebar: ReactNode;
  children: ReactNode;
};

export function AppShell({
  isSessionMode,
  isSidebarCollapsed,
  sidebar,
  children,
}: AppShellProps) {
  const shellStyle = {
    "--sidebar-width": isSidebarCollapsed ? "84px" : "248px",
  } as CSSProperties;

  return (
    <main
      className={cn(
        "min-h-screen bg-background text-foreground [--sidebar-width:248px]",
        isSessionMode && "selection:bg-primary/30",
      )}
      style={shellStyle}
    >
      {sidebar}
      <section className="grid min-w-0 gap-7 px-4 pb-8 pt-6 pl-[calc(var(--sidebar-width)+1rem)] md:px-6 md:pb-10 md:pl-[calc(var(--sidebar-width)+1.5rem)]">
        {children}
      </section>
    </main>
  );
}
