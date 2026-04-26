const INTERACTIVE_WIDGET_SELECTOR =
  "button, input, select, textarea, a, [role='button'], [data-widget-no-drag]";

export function shouldStartWidgetWindowDrag(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  return !target.closest(INTERACTIVE_WIDGET_SELECTOR);
}
