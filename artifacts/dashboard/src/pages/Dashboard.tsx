import { useQuery, useIsFetching } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { WalletCard } from "@/components/WalletCard";
import { PositionsTable } from "@/components/PositionsTable";
import { ExitReasonsDonut } from "@/components/ExitReasonsDonut";
import { ClosedTradesFeed } from "@/components/ClosedTradesFeed";
import { DevsTable, UnknownsTable } from "@/components/DevsTable";
import { LaunchesTicker } from "@/components/LaunchesTicker";
import { SystemHealthStrip } from "@/components/SystemHealthStrip";
import { HealthAlertBanner } from "@/components/HealthAlertBanner";
import { Pulse } from "@/components/ui/Pulse";
import { api } from "@/lib/api";
import { formatSol, formatPct, lamToSol, formatAgeS } from "@/lib/format";

export function Dashboard() {
  const [lastUpdateMs, setLastUpdateMs] = useState<number | null>(null);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const isFetching = useIsFetching();

  const { data: health } = useQuery({
    queryKey: ["systemHealth"],
    queryFn: async () => {
      const t0 = performance.now();
      const result = await api.systemHealth();
      setApiLatencyMs(Math.round(performance.now() - t0));
      return result;
    },
    refetchInterval: 5000,
    staleTime: 0,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: api.wallet,
    refetchInterval: 5000,
    staleTime: 0,
  });

  useEffect(() => {
    if (isFetching === 0) {
      setLastUpdateMs(Date.now());
    }
  }, [isFetching]);

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const lastUpdateSec =
    lastUpdateMs != null ? Math.floor((nowMs - lastUpdateMs) / 1000) : null;

  const pnlSol = wallet ? lamToSol(wallet.cum_pnl_lam) : null;
  const pnlPos = (pnlSol ?? 0) >= 0;
  const pnlPct =
    wallet && wallet.initial_bankroll_lam > 0
      ? (wallet.cum_pnl_lam / wallet.initial_bankroll_lam) * 100
      : null;

  const eps = health?.events_per_sec_60s ?? null;
  const ingestorAge = health?.ingestor_heartbeat_age_s ?? null;
  const solUsd = health?.sol_usd ?? null;
  const apiStale = apiLatencyMs != null && apiLatencyMs > 500;
  const ingestorStale = ingestorAge != null && ingestorAge > 120;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] flex flex-col">

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f] border-b border-[#1f1f2e] h-14 flex items-center px-4 gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono font-bold text-white text-lg tracking-tight">GPT</span>
          <span className="text-[10px] text-[#8b8b9a] tracking-widest hidden sm:block">
            PAPER · GCP · us-east4-c
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-6 min-w-0 overflow-hidden">
          {wallet && (
            <>
              <div className="text-center flex-shrink-0">
                <div className="text-[9px] text-[#8b8b9a] tracking-widest">SOL BALANCE</div>
                <div className="font-mono text-xl font-bold text-white tabular-nums leading-tight">
                  {formatSol(wallet.sol_balance_lam)}
                </div>
              </div>
              {pnlSol != null && (
                <div className="text-center flex-shrink-0">
                  <div className="text-[9px] text-[#8b8b9a] tracking-widest">CUM PNL</div>
                  <div
                    className={`font-mono text-lg font-semibold tabular-nums flex items-center gap-1 leading-tight ${
                      pnlPos ? "text-[#00d4aa]" : "text-[#ff4757]"
                    }`}
                  >
                    <span>{pnlPos ? "▲" : "▼"}</span>
                    <span>{formatPct(pnlPct)}</span>
                    <span className="text-sm opacity-80">
                      {pnlPos ? "+" : ""}{pnlSol.toFixed(3)} SOL
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {solUsd != null && (
            <span className="font-mono text-[11px] text-[#8b8b9a] hidden sm:block">
              SOL ${solUsd.toFixed(0)}
            </span>
          )}
          {eps != null && (
            <span className={`font-mono text-[11px] hidden sm:block ${eps < 10 ? "text-[#ff4757]" : "text-[#8b8b9a]"}`}>
              {eps.toFixed(1)} eps
            </span>
          )}
          {ingestorAge != null && (
            <span
              className={`font-mono text-[11px] hidden md:block ${ingestorStale ? "text-[#ff4757]" : "text-[#8b8b9a]"}`}
              title="Ingestor heartbeat age"
            >
              ing {formatAgeS(ingestorAge)}
            </span>
          )}
          {apiLatencyMs != null && (
            <span
              className={`font-mono text-[11px] hidden md:block ${apiStale ? "text-[#ff4757]" : "text-[#8b8b9a]"}`}
              title="API round-trip latency"
            >
              {apiLatencyMs}ms
            </span>
          )}
          <Pulse active={isFetching > 0} />
          {lastUpdateSec != null && (
            <span className="text-[10px] text-[#555566] font-mono whitespace-nowrap">
              {lastUpdateSec}s ago
            </span>
          )}
        </div>
      </header>

      {/* ── Health alert banner — only rendered when a metric is red ── */}
      <HealthAlertBanner health={health} />

      {/* ── Scrollable body — single column < 1024px, grid ≥ 1024px ── */}
      <div className="flex-1 overflow-auto">

        {/* Launches ticker — always full width at top of body */}
        <LaunchesTicker />

        {/* ── Narrow (<1024px): stack all panels vertically ── */}
        <div className="lg:hidden flex flex-col">
          <div className="border-b border-[#1f1f2e]" style={{ minHeight: 220 }}>
            <WalletCard health={health} />
          </div>
          <div className="border-b border-[#1f1f2e]" style={{ minHeight: 260 }}>
            <PositionsTable health={health} />
          </div>
          <div className="border-b border-[#1f1f2e]" style={{ minHeight: 320 }}>
            <ClosedTradesFeed />
          </div>
          <div className="border-b border-[#1f1f2e]" style={{ minHeight: 300 }}>
            <ExitReasonsDonut />
          </div>
          <div className="border-b border-[#1f1f2e]" style={{ minHeight: 240 }}>
            <DevsTable />
          </div>
          <div className="border-b border-[#1f1f2e]" style={{ minHeight: 240 }}>
            <UnknownsTable />
          </div>
        </div>

        {/* ── Desktop (≥1024px): 2-column grid rows ── */}
        <div className="hidden lg:block">
          {/* Row 1: Wallet + Positions */}
          <div
            className="grid border-b border-[#1f1f2e]"
            style={{ height: 280, gridTemplateColumns: "33.333% 1fr" }}
          >
            <div className="border-r border-[#1f1f2e]"><WalletCard health={health} /></div>
            <div><PositionsTable health={health} /></div>
          </div>

          {/* Row 2: Exit donut + Closed trades */}
          <div
            className="grid border-b border-[#1f1f2e]"
            style={{ height: 340, gridTemplateColumns: "33.333% 1fr" }}
          >
            <div className="border-r border-[#1f1f2e]"><ExitReasonsDonut /></div>
            <div><ClosedTradesFeed /></div>
          </div>

          {/* Row 3: Dev watchlist + Top unknowns */}
          <div
            className="grid border-b border-[#1f1f2e]"
            style={{ height: 260, gridTemplateColumns: "1fr 1fr" }}
          >
            <div className="border-r border-[#1f1f2e]"><DevsTable /></div>
            <div><UnknownsTable /></div>
          </div>
        </div>

        {/* System health footer — always visible */}
        <SystemHealthStrip health={health} apiLatencyMs={apiLatencyMs} />
      </div>
    </div>
  );
}
