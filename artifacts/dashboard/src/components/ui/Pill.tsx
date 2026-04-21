import { cn } from "@/lib/utils";

const EXIT_REASON_COLORS: Record<string, string> = {
  rugged: "bg-[#3d1010] text-[#ff6b6b] border border-[#5a1a1a]",
  sl_hit: "bg-[#3d1a10] text-[#ff8c42] border border-[#5a2a10]",
  honeypot: "bg-[#3d2010] text-[#ffaa55] border border-[#5a3010]",
  timeout: "bg-[#1a1a1a] text-[#8b8b9a] border border-[#2a2a2a]",
  no_data: "bg-[#1a1a1a] text-[#8b8b9a] border border-[#2a2a2a]",
  trail_stop: "bg-[#0d2a22] text-[#00d4aa] border border-[#1a3d30]",
  profit_target: "bg-[#0d2a22] text-[#00d4aa] border border-[#1a3d30]",
  manual: "bg-[#1a2230] text-[#6699cc] border border-[#263040]",
};

function getReasonColor(reason: string): string {
  return (
    EXIT_REASON_COLORS[reason] ??
    "bg-[#0d2a22] text-[#00d4aa] border border-[#1a3d30]"
  );
}

interface PillProps {
  reason: string | null;
}

export function Pill({ reason }: PillProps) {
  const label = reason ?? "unknown";
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-sm",
        getReasonColor(label)
      )}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}
