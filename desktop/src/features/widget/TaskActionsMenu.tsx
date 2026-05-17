import { MoreHorizontal, PencilLine, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../shared/components/ui/button.tsx";

type TaskActionsMenuProps = {
  taskTitle: string;
  onEdit?: () => void;
  onMarkIncomplete: () => void;
  incompleteDisabled?: boolean;
};

export function TaskActionsMenu({
  taskTitle,
  onEdit,
  onMarkIncomplete,
  incompleteDisabled = false,
}: TaskActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-[var(--radius-small)] border-border bg-muted/16"
        onClick={() => setOpen((value) => !value)}
        aria-label={`More options for ${taskTitle}`}
        aria-expanded={open}
        title="More options"
      >
        <MoreHorizontal size={16} />
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.35rem)] z-20 grid min-w-48 overflow-hidden rounded-[var(--radius-medium)] border border-border bg-[rgba(8,24,46,0.98)] py-1 shadow-[var(--shadow-soft)]">
          {onEdit ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
              onClick={() => {
                onEdit();
                setOpen(false);
              }}
            >
              <PencilLine size={14} />
              Edit task
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 text-left text-sm text-orange-200 transition-colors hover:bg-orange-500/12 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
            disabled={incompleteDisabled}
            onClick={() => {
              onMarkIncomplete();
              setOpen(false);
            }}
          >
            <XCircle size={14} />
            Incomplete
          </button>
        </div>
      ) : null}
    </div>
  );
}
