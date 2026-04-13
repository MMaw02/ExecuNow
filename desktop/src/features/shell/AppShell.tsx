import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../shared/lib/cn.ts";

type AppShellProps = {
  isSessionMode: boolean;
  isSidebarCollapsed: boolean;
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
};

export function AppShell({
  isSessionMode,
  isSidebarCollapsed,
  sidebar,
  topbar,
  children,
}: AppShellProps) {
  const shellStyle = {
    "--sidebar-width": isSidebarCollapsed ? "84px" : "248px",
  } as CSSProperties;

  return (
    <main
      className={cn(
        "min-h-screen text-text-primary [--sidebar-width:248px]",
        isSessionMode && "selection:bg-accent-primary/30",
      )}
      style={shellStyle}
    >
      <section>
        {sidebar}
        <div className="grid min-w-0 gap-7 px-4 pb-8 pt-6 md:px-6 md:pb-10 md:pl-[calc(var(--sidebar-width)+1.5rem)]">
          {topbar}
          <div className="grid min-w-0 gap-7">{children}</div>
        </div>
      </section>
    </main>
  );
}
