import { formatAgeS } from "@/lib/format";
import type { SystemHealth } from "@/lib/types";

interface SystemHealthStripProps {
  health: SystemHealth | undefined;
  apiLatencyMs: number | null;
}

function HealthItem({
  label,
  value,
  isStale,
}: {
  label: string;
  value: string;
  isStale: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-[#555566] text-[10px]">{label}</span>
      <span
        className={`font-mono text-[11px] tabular-nums ${
          isStale ? "text-[#ff4757]" : "text-[#e8e8f0]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function SystemHealthStrip({ health, apiLatencyMs }: SystemHealthStripProps) {
  const eps = health?.events_per_sec_60s ?? null;
  const ingestorAge = health?.ingestor_heartbeat_age_s ?? null;
  const telegramAge = health?.telegram_bot_heartbeat_age_s ?? null;
  const solUsd = health?.sol_usd ?? null;
  const solUsdAge = health?.sol_usd_cache_age_s ?? null;

  return (
    <div className="bg-[#0e0e16] border-t border-[#1f1f2e] h-10 flex items-center px-4 gap-5 overflow-x-auto flex-shrink-0">
      <HealthItem
        label="eps"
        value={eps != null ? eps.toFixed(1) : "—"}
        isStale={eps != null && eps < 10}
      />
      <HealthItem
        label="ingestor"
        value={ingestorAge != null ? formatAgeS(ingestorAge) : "—"}
        isStale={ingestorAge != null && ingestorAge > 120}
      />
      <HealthItem
        label="telegram"
        value={telegramAge != null ? formatAgeS(telegramAge) : "—"}
        isStale={telegramAge != null && telegramAge > 120}
      />
      <HealthItem
        label="SOL/USD"
        value={
          solUsd != null
            ? `$${solUsd.toFixed(2)}${solUsdAge != null ? ` (${formatAgeS(solUsdAge)})` : ""}`
            : "—"
        }
        isStale={solUsdAge != null && solUsdAge > 300}
      />
      <HealthItem
        label="launches/5m"
        value={health?.launches_5m != null ? String(health.launches_5m) : "—"}
        isStale={false}
      />
      <HealthItem
        label="scores/5m"
        value={health?.score_events_5m != null ? String(health.score_events_5m) : "—"}
        isStale={false}
      />
      <HealthItem
        label="api"
        value={apiLatencyMs != null ? `${apiLatencyMs}ms` : "—"}
        isStale={apiLatencyMs != null && apiLatencyMs > 500}
      />
    </div>
  );
}
