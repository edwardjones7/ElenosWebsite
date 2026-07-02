import type { TicketStatus } from "@/lib/ticket-format";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/ticket-format";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color,
        background: `${color}1a`,
        border: `1px solid ${color}55`,
        borderRadius: 999,
        padding: "3px 10px",
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
