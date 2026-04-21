import { useQuery } from "@tanstack/react-query";
import { useState, Fragment } from "react";
import { ChevronDown, ChevronRight, ExternalLink, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { formatTimeCst, formatDateGroupCst, formatPct } from "@/lib/format";
import type { ClosedTrade } from "@/lib/types";

interface FeedRowProps {
  trade: ClosedTrade;
}

function FeedRow({ trade }: FeedRowProps) {
  const [expanded, setExpanded] = useState(false);
  const pnlPos = (trade.sol_pnl ?? 0) >= 0;
  const retPos = (trade.return_pct ?? 0) >= 0;

  return (
    <>
      <tr
        className="border-b border-[#1f1f2e] hover:bg-[#16161f] cursor-pointer transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-3 py-1.5 text-[#8b8b9a] font-mono text-[11px] tabular-nums whitespace-nowrap">
          {trade.exit_at ? formatTimeCst(trade.exit_at) : "—"}
        </td>
        <td className="px-3 py-1.5">
          <span className="font-mono font-bold text-white text-[12px]">
            {trade.symbol ?? trade.mint.slice(0, 6) + "…"}
          </span>
        </td>
        <td className="px-3 py-1.5">
          <Pill reason={trade.exit_reason} />
        </td>
        <td className={`px-3 py-1.5 text-right font-mono tabular-nums text-[12px] font-semibold ${retPos ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
          {formatPct(trade.return_pct ?? null)}
        </td>
        <td className={`px-3 py-1.5 text-right font-mono tabular-nums text-[12px] ${pnlPos ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
          {trade.sol_pnl != null
            ? `${pnlPos ? "+" : ""}${trade.sol_pnl.toFixed(3)}`
            : "—"}
        </td>
        <td className="px-2 py-1.5 text-[#8b8b9a]">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[#0e0e16] border-b border-[#1f1f2e]">
          <td colSpan={6} className="px-4 py-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] font-mono text-[#8b8b9a]">
              <div>
                <span className="text-[#555566]">Entry: </span>
                <span className="text-[#e8e8f0]">{trade.entry_at ? formatTimeCst(trade.entry_at) : "—"}</span>
              </div>
              <div>
                <span className="text-[#555566]">Exit: </span>
                <span className="text-[#e8e8f0]">{trade.exit_at ? formatTimeCst(trade.exit_at) : "—"}</span>
              </div>
              <div>
                <span className="text-[#555566]">Peak: </span>
                <span className="text-[#00d4aa]">{formatPct(trade.peak_return_pct ?? null)}</span>
              </div>
              <div>
                <span className="text-[#555566]">Archetype: </span>
                <span className="text-[#e8e8f0]">{trade.archetype ?? "unknown"}</span>
              </div>
              <div className="col-span-2 flex gap-3 pt-0.5">
                {[
                  [`https://pump.fun/coin/${trade.mint}`, "pump.fun"],
                  [`https://dexscreener.com/solana/${trade.mint}`, "dexscreener"],
                  [`https://solscan.io/token/${trade.mint}`, "solscan"],
                ].map(([href, label]) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[#e8e8f0]"
                  >
                    <ExternalLink size={10} /> {label}
                  </a>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ClosedTradesFeed() {
  const [limit, setLimit] = useState(50);

  const { data: trades = [], isError, error } = useQuery({
    queryKey: ["closedTrades", limit],
    queryFn: () => api.closedTrades(limit),
    refetchInterval: 5000,
    staleTime: 0,
  });

  const dateMap = new Map<string, ClosedTrade[]>();
  for (const t of trades) {
    const d = t.exit_at ? formatDateGroupCst(t.exit_at) : "UNKNOWN";
    if (!dateMap.has(d)) dateMap.set(d, []);
    dateMap.get(d)!.push(t);
  }

  const grouped = Array.from(dateMap.entries()).map(([date, list]) => ({ date, trades: list }));

  return (
    <Card title="Closed Trades" className="h-full">
      {isError && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2a1010] border-b border-[#ff4757] text-[#ff4757] text-[11px]">
          <AlertTriangle size={12} />
          <span>{error instanceof Error ? error.message : "fetch error"} — showing last values</span>
        </div>
      )}
      <div className="overflow-auto h-full">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-[#8b8b9a] border-b border-[#1f1f2e] text-left sticky top-0 bg-[#12121a]">
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Symbol</th>
              <th className="px-3 py-2 font-medium">Reason</th>
              <th className="px-3 py-2 font-medium text-right">Return%</th>
              <th className="px-3 py-2 font-medium text-right">PnL SOL</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-[#8b8b9a] py-10">No closed trades</td>
              </tr>
            )}
            {grouped.map(({ date, trades: rows }) => (
              <Fragment key={date}>
                <tr className="bg-[#0e0e16]">
                  <td colSpan={6} className="px-3 py-1 text-[10px] font-semibold tracking-widest text-[#8b8b9a] uppercase">
                    {date}
                  </td>
                </tr>
                {rows.map((t) => <FeedRow key={t.launch_id} trade={t} />)}
              </Fragment>
            ))}
          </tbody>
        </table>
        {trades.length >= limit && (
          <div className="px-3 py-2 border-t border-[#1f1f2e]">
            <button className="text-[11px] text-[#00d4aa] hover:underline" onClick={() => setLimit((l) => l + 50)}>
              Load more ▾
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
