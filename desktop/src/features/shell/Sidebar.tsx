import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  ChartColumn,
  History,
  House,
  ListTodo,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Shield,
} from "lucide-react";
import { Badge } from "../../shared/components/ui/badge.tsx";
import { Button } from "../../shared/components/ui/button.tsx";
import { Separator } from "../../shared/components/ui/separator.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../shared/components/ui/tooltip.tsx";
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
  isWidgetActionDisabled: boolean;
  onNavigate: (target: NavView) => void;
  onOpenWidget: () => void;
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
  isWidgetActionDisabled,
  onNavigate,
  onOpenWidget,
  onToggleCollapsed,
}: SidebarProps) {
  const primaryItems = navItems.filter((item) => item.id !== "settings");
  const settingsItem = navItems.find((item) => item.id === "settings");

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[var(--sidebar-width)] flex-col border-r border-border bg-popover/95 px-3 pb-3 pt-4 shadow-[var(--shadow-soft)] backdrop-blur-sm transition-[width] duration-200">
      <div className="flex flex-col gap-3 px-1">
        <Button
          variant="outline"
          size="icon"
          className="justify-self-start border-border bg-card text-muted-foreground"
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

        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <span
            className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(78,222,163,0.12)]"
            aria-hidden="true"
          />
          {!isCollapsed ? (
            <div className="grid gap-0.5">
              <strong className="text-[0.96rem] leading-none tracking-[0.12em] text-foreground">
                EXECUNOW
              </strong>
              <span className="text-[0.68rem] uppercase leading-none tracking-[0.14em] text-muted-foreground">
                Peak performance
              </span>
            </div>
          ) : null}
        </div>

        {!isCollapsed ? (
          <Badge variant="success" className="w-fit">
            Ready
          </Badge>
        ) : null}
      </div>

      <Separator className="my-4" />

      <TooltipProvider delayDuration={120}>
        <nav className="grid content-start gap-2" aria-label="Primary navigation">
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

        <div className="mt-auto grid gap-4">
          <Separator />
          <SidebarWidgetLauncher
            isCollapsed={isCollapsed}
            disabled={isWidgetActionDisabled}
            onOpenWidget={onOpenWidget}
          />
          {settingsItem ? (
            <>
              <Separator />
              <SidebarItem
                item={settingsItem}
                icon={ICONS.settings}
                activeView={activeView}
                isCollapsed={isCollapsed}
                disabled={!canNavigateTo(settingsItem.id)}
                onNavigate={onNavigate}
              />
            </>
          ) : null}
        </div>
      </TooltipProvider>
    </aside>
  );
}

type SidebarWidgetLauncherProps = {
  isCollapsed: boolean;
  disabled: boolean;
  onOpenWidget: () => void;
};

function SidebarWidgetLauncher({
  isCollapsed,
  disabled,
  onOpenWidget,
}: SidebarWidgetLauncherProps) {
  const title = "Open focus widget";
  const helperCopy = disabled
    ? "Available after you finish the current focus flow."
    : "Keep quick tasks and launch controls close by.";

  const launcherButton = (
    <Button
      variant={isCollapsed ? "outline" : "secondary"}
      size={isCollapsed ? "icon" : "default"}
      className={cn(
        "shrink-0",
        isCollapsed
          ? "border-border bg-card text-muted-foreground"
          : "w-full justify-start bg-secondary/70 text-secondary-foreground hover:bg-secondary",
      )}
      onClick={onOpenWidget}
      disabled={disabled}
      aria-label={title}
    >
      <AppWindow size={18} strokeWidth={2.1} aria-hidden="true" />
      {!isCollapsed ? <span>Open focus widget</span> : null}
    </Button>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{launcherButton}</TooltipTrigger>
        <TooltipContent side="right">
          {disabled ? "Focus widget available after the current session." : title}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className="grid gap-3 rounded-[var(--radius-medium)] border border-border bg-muted/30 p-3">
      <div className="grid gap-1">
        <span className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Quick access
        </span>
        <p className="text-sm text-muted-foreground">{helperCopy}</p>
      </div>
      {launcherButton}
    </div>
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
  const itemButton = (
    <Button
      variant="ghost"
      className={cn(
        "h-10 w-full justify-start gap-3 rounded-[var(--radius-small)] px-3 text-left text-muted-foreground",
        isCollapsed && "justify-center px-0",
        item.id === activeView &&
          "bg-primary/12 text-primary hover:bg-primary/14 hover:text-primary",
        item.id !== activeView && "hover:bg-accent hover:text-accent-foreground",
      )}
      onClick={() => onNavigate(item.id)}
      disabled={disabled}
      aria-current={item.id === activeView ? "page" : undefined}
      aria-label={item.label}
    >
      <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
      {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
    </Button>
  );

  if (!isCollapsed) {
    return itemButton;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{itemButton}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
