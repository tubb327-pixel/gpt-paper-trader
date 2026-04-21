import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/DashCard";
import type { Archetype, DevRow } from "@/lib/types";

const ARCHETYPE_DOT: Record<Archetype, string> = {
  quality_dev: "bg-[#00d4aa]",
  whale_dev: "bg-[#4488ff]",
  moderate_dev: "bg-[#88aadd]",
  serial_rugger: "bg-[#ff4757]",
  bot_cluster: "bg-[#ffaa00]",
  unknown: "bg-[#8b8b9a]",
};

function DevTableContent({ rows }: { rows: DevRow[] }) {
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[#8b8b9a] border-b border-[#1f1f2e] text-left sticky top-0 bg-[#12121a]">
          <th className="px-3 py-2 font-medium">Type</th>
          <th className="px-3 py-2 font-medium">Label</th>
          <th className="px-3 py-2 text-right font-medium">Launches</th>
          <th className="px-3 py-2 text-right font-medium">Mig%</th>
          <th className="px-3 py-2 text-right font-medium">7d Mig</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="text-center text-[#8b8b9a] py-8 text-[12px]">No data</td>
          </tr>
        )}
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-[#1f1f2e] hover:bg-[#16161f] transition-colors">
            <td className="px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full inline-block ${ARCHETYPE_DOT[row.archetype]}`} />
            </td>
            <td className="px-3 py-1.5 font-mono text-[#e8e8f0]">
              {row.label ?? <span className="text-[#8b8b9a]">unlabeled</span>}
            </td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums text-[#e8e8f0]">
              {row.total_launches}
            </td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums text-[#e8e8f0]">
              {row.migration_rate != null ? `${(row.migration_rate * 100).toFixed(0)}%` : "—"}
            </td>
            <td className="px-3 py-1.5 text-right font-mono tabular-nums text-[#00d4aa]">
              {row.recent_migrations_7d}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DevsTable() {
  const { data: devs = [], isError, error } = useQuery({
    queryKey: ["devs"],
    queryFn: api.devs,
    refetchInterval: 5000,
    staleTime: 0,
  });

  return (
    <Card title="Watchlist · quality_dev / whale_dev" className="h-full">
      {isError && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2a1010] border-b border-[#ff4757] text-[#ff4757] text-[11px]">
          <AlertTriangle size={12} />
          <span>{error instanceof Error ? error.message : "fetch error"} — showing last values</span>
        </div>
      )}
      <div className="overflow-auto h-full">
        <DevTableContent rows={devs.slice(0, 20)} />
      </div>
    </Card>
  );
}

export function UnknownsTable() {
  const { data: unknowns = [], isError, error } = useQuery({
    queryKey: ["unknowns"],
    queryFn: () => api.unknowns(25),
    refetchInterval: 5000,
    staleTime: 0,
  });

  return (
    <Card
      title="Top Unknowns"
      className="h-full"
      headerRight={
        <span
          className="text-[10px] text-[#8b8b9a] cursor-help"
          title="Wallets with ≥1 migration that the classifier keeps as 'unknown' — below the 75% / 50% / 4-launch bars."
        >
          ?
        </span>
      }
    >
      {isError && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2a1010] border-b border-[#ff4757] text-[#ff4757] text-[11px]">
          <AlertTriangle size={12} />
          <span>{error instanceof Error ? error.message : "fetch error"} — showing last values</span>
        </div>
      )}
      <div className="overflow-auto h-full">
        <DevTableContent rows={unknowns} />
      </div>
    </Card>
  );
}
