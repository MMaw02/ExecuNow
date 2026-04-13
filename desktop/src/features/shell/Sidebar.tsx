import type { LucideIcon } from "lucide-react";
import {
  ChartColumn,
  History,
  House,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
} from "lucide-react";
import { Button } from "../../shared/components/ui/button.tsx";
import { cn } from "../../shared/lib/cn.ts";
import type {
  NavigationItem,
  NavView,
  View,
} from "../session/session.types.ts";

type SidebarProps = {
  navItems: readonly NavigationItem[];
  activeView: NavView;
  isCollapsed: boolean;
  canNavigateTo: (target: View) => boolean;
  onNavigate: (target: NavView) => void;
  onToggleCollapsed: () => void;
};

const ICONS: Record<NavView, LucideIcon> = {
  today: House,
  tasks: ListTodo,
  history: History,
  summary: ChartColumn,
  blocking: Shield,
  settings: Settings,
};

export function Sidebar({
  navItems,
  activeView,
  isCollapsed,
  canNavigateTo,
  onNavigate,
  onToggleCollapsed,
}: SidebarProps) {
  const primaryItems = navItems.filter((item) => item.id !== "settings");
  const settingsItem = navItems.find((item) => item.id === "settings");

  return (
    <aside className="fixed inset-y-0 left-0 z-10 grid w-[var(--sidebar-width)] grid-rows-[auto_1fr_auto] overflow-y-auto rounded-r-[16px] border-r border-border-subtle bg-[rgba(7,24,46,0.9)] px-3 pb-3 pt-4 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-[width,padding] duration-200">
      <div className="grid gap-3.5 border-b border-border-subtle px-1 pb-3">
        <Button
          variant="secondary"
          size="icon"
          className="justify-self-start bg-surface-subtle/75 text-text-secondary"
          onClick={onToggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={18} aria-hidden="true" />
          )}
        </Button>

        <div className="grid min-h-9 grid-flow-col items-center gap-3">
          <span
            className="h-3 w-3 rounded-full bg-accent-success shadow-[0_0_0_4px_rgba(78,222,163,0.14)]"
            aria-hidden="true"
          />
          {!isCollapsed && (
            <div className="grid gap-0.5">
              <strong className="text-[0.96rem] leading-none tracking-[0.12em] text-text-primary">
                EXECUNOW
              </strong>
              <span className="text-[0.68rem] uppercase leading-none tracking-[0.14em] text-text-secondary">
                Peak performance
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="grid content-start gap-2 pt-3.5" aria-label="Primary navigation">
        {primaryItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            icon={ICONS[item.id]}
            activeView={activeView}
            isCollapsed={isCollapsed}
            disabled={!canNavigateTo(item.id)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {settingsItem ? (
        <div className="mt-auto border-t border-border-subtle pt-3.5">
          <SidebarItem
            item={settingsItem}
            icon={ICONS.settings}
            activeView={activeView}
            isCollapsed={isCollapsed}
            disabled={!canNavigateTo(settingsItem.id)}
            onNavigate={onNavigate}
          />
        </div>
      ) : null}
    </aside>
  );
}

type SidebarItemProps = {
  item: NavigationItem;
  icon: LucideIcon;
  activeView: NavView;
  isCollapsed: boolean;
  disabled: boolean;
  onNavigate: (target: NavView) => void;
};

function SidebarItem({
  item,
  icon: Icon,
  activeView,
  isCollapsed,
  disabled,
  onNavigate,
}: SidebarItemProps) {
  return (
    <Button
      variant="ghost"
      size="default"
      active={item.id === activeView}
      className={cn(
        "grid w-full items-center gap-3 text-left",
        isCollapsed
          ? "grid-cols-1 justify-items-center px-0"
          : "grid-cols-[18px_minmax(0,1fr)] px-3.5",
        item.id !== activeView &&
          "border-transparent bg-transparent text-text-secondary",
        disabled && "opacity-35",
      )}
      onClick={() => onNavigate(item.id)}
      disabled={disabled}
      aria-current={item.id === activeView ? "page" : undefined}
      aria-label={item.label}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
      {!isCollapsed && <span>{item.label}</span>}
    </Button>
  );
}
