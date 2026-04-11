import { Info } from "lucide-react";

type InfoHintProps = {
  label: string;
};

export function InfoHint({ label }: InfoHintProps) {
  return (
    <span
      className="info-hint"
      tabIndex={0}
      role="note"
      aria-label={label}
      title={label}
    >
      <Info size={12} strokeWidth={2.2} aria-hidden="true" />
      <span className="info-tooltip" role="tooltip">
        {label}
      </span>
    </span>
  );
}
