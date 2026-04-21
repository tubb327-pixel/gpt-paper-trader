import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { formatAge, formatMc, formatPct, formatSolRaw } from "@/lib/format";
import type { Archetype, SystemHealth } from "@/lib/types";

const ARCHETYPE_DOT: Record<Archetype, string> = {
  quality_dev: "bg-[#00d4aa]",
  whale_dev: "bg-[#4488ff]",
  moderate_dev: "bg-[#88aadd]",
  serial_rugger: "bg-[#ff4757]",
  bot_cluster: "bg-[#ffaa00]",
  unknown: "bg-[#8b8b9a]",
};

const ARCHETYPE_LABEL: Record<Archetype, string> = {
  quality_dev: "quality",
  whale_dev: "whale",
  moderate_dev: "moderate",
  serial_rugger: "rugger",
  bot_cluster: "bot",
  unknown: "unknown",
};

interface PositionsTableProps {
  health: SystemHealth | undefined;
}

export function PositionsTable({ health }: PositionsTableProps) {
  const [tick, setTick] = useState(0);

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: api.positions,
    refetchInterval: 5000,
    staleTime: 0,
  });

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const solUsd = health?.sol_usd ?? 0;

  return (
    <Card title="Open Positions" className="h-full">
      <div className="overflow-auto h-full">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[#8b8b9a] border-b border-[#1f1f2e] text-left">
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Symbol</th>
              <th className="px-3 py-2 font-medium text-right">Age</th>
              <th className="px-3 py-2 font-medium text-right">Entry MC</th>
              <th className="px-3 py-2 font-medium text-right">Current MC</th>
              <th className="px-3 py-2 font-medium text-right">Unreal%</th>
              <th className="px-3 py-2 font-medium text-right">PnL SOL</th>
              <th className="px-3 py-2 font-medium text-center">Links</th>
            </tr>
          </thead>
          <tbody>
            {positions.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-[#8b8b9a] py-10">
                  No open positions
                </td>
              </tr>
            )}
            {positions.map((pos) => {
              const entryMc =
                solUsd > 0 ? formatMc(pos.entry_price, solUsd) : "—";
              const currentMc =
                pos.current_price != null && solUsd > 0
                  ? formatMc(pos.current_price, solUsd)
                  : "—";

              const entryPriceToken = pos.entry_price;
              const currentPriceToken = pos.current_price;
              const unrPct =
                entryPriceToken > 0 && currentPriceToken != null
                  ? ((currentPriceToken - entryPriceToken) / entryPriceToken) *
                    100
                  : null;

              const positionSol =
                pos.sol_in_lamports != null ? pos.sol_in_lamports / 1e9 : null;
              const unrSol =
                unrPct != null && positionSol != null
                  ? positionSol * (unrPct / 100)
                  : null;

              const posPositive = (unrPct ?? 0) >= 0;
              const arch = pos.archetype ?? "unknown";

              return (
                <tr
                  key={pos.launch_id}
                  className="border-b border-[#1f1f2e] hover:bg-[#16161f] transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${ARCHETYPE_DOT[arch]}`}
                      />
                      <span className="text-[#8b8b9a] text-[10px]">
                        {ARCHETYPE_LABEL[arch]}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-mono font-bold text-white">
                      {pos.symbol ?? pos.mint.slice(0, 6) + "…"}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[#e8e8f0] tabular-nums">
                    {tick >= 0 ? formatAge(pos.entry_at) : ""}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[#e8e8f0] tabular-nums">
                    {entryMc}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[#e8e8f0] tabular-nums">
                    {currentMc}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono tabular-nums font-semibold ${
                      posPositive ? "text-[#00d4aa]" : "text-[#ff4757]"
                    }`}
                  >
                    {formatPct(unrPct)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono tabular-nums ${
                      posPositive ? "text-[#00d4aa]" : "text-[#ff4757]"
                    }`}
                  >
                    {unrSol != null
                      ? `${unrSol >= 0 ? "+" : ""}${formatSolRaw(unrSol)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 justify-center">
                      <a
                        href={`https://pump.fun/coin/${pos.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8b8b9a] hover:text-[#e8e8f0] transition-colors"
                        title="pump.fun"
                      >
                        <ExternalLink size={12} />
                      </a>
                      <a
                        href={`https://dexscreener.com/solana/${pos.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8b8b9a] hover:text-[#e8e8f0] transition-colors"
                        title="DexScreener"
                      >
                        <ExternalLink size={12} />
                      </a>
                      <a
                        href={`https://solscan.io/token/${pos.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8b8b9a] hover:text-[#e8e8f0] transition-colors"
                        title="Solscan"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
