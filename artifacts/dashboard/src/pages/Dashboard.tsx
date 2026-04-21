import { useQuery, useIsFetching } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { WalletCard } from "@/components/WalletCard";
import { PositionsTable } from "@/components/PositionsTable";
import { ExitReasonsDonut } from "@/components/ExitReasonsDonut";
import { ClosedTradesFeed } from "@/components/ClosedTradesFeed";
import { DevsTable, UnknownsTable } from "@/components/DevsTable";
import { LaunchesTicker } from "@/components/LaunchesTicker";
import { SystemHealthStrip } from "@/components/SystemHealthStrip";
import { Pulse } from "@/components/ui/Pulse";
import { api } from "@/lib/api";
import { formatSol, formatPct, lamToSol, formatAgeS } from "@/lib/format";

type Tab = "wallet" | "positions" | "trades" | "devs" | "system";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("positions");
  const [moreOpen, setMoreOpen] = useState(false);
  const [lastUpdateMs, setLastUpdateMs] = useState<number | null>(null);
  const [apiLatencyMs, setApiLatencyMs] = useState<number | null>(null);
  const fetchStartRef = useRef<number | null>(null);
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
    if (isFetching > 0) {
      fetchStartRef.current = Date.now();
    } else {
      setLastUpdateMs(Date.now());
    }
  }, [isFetching]);

  // Last-update ticker — refreshes every second
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "wallet", label: "Wallet" },
    { id: "positions", label: "Positions" },
    { id: "trades", label: "Trades" },
    { id: "devs", label: "Devs" },
    { id: "system", label: "System" },
  ];

  // Health status for top bar
  const eps = health?.events_per_sec_60s ?? null;
  const ingestorAge = health?.ingestor_heartbeat_age_s ?? null;
  const solUsd = health?.sol_usd ?? null;
  const apiStale = apiLatencyMs != null && apiLatencyMs > 500;
  const ingestorStale = ingestorAge != null && ingestorAge > 120;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] flex flex-col">
      {/* ── Top Bar 56px ── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f] border-b border-[#1f1f2e] h-14 flex items-center px-4 gap-4 flex-shrink-0">
        {/* Left: wordmark */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono font-bold text-white text-lg tracking-tight">GPT</span>
          <span className="text-[10px] text-[#8b8b9a] tracking-widest hidden sm:block">
            PAPER · GCP · us-east4-c
          </span>
        </div>

        {/* Center: wallet summary */}
        <div className="flex-1 flex items-center justify-center gap-6 min-w-0 overflow-hidden">
          {wallet && (
            <>
              <div className="text-center hidden md:block flex-shrink-0">
                <div className="text-[9px] text-[#8b8b9a] tracking-widest">SOL BALANCE</div>
                <div className="font-mono text-xl font-bold text-white tabular-nums leading-tight">
                  {formatSol(wallet.sol_balance_lam)}
                </div>
              </div>
              {pnlSol != null && (
                <div className="text-center hidden md:block flex-shrink-0">
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

        {/* Right: system health + pulse + last-update */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {solUsd != null && (
            <span className="font-mono text-[11px] text-[#8b8b9a] hidden lg:block">
              SOL ${solUsd.toFixed(0)}
            </span>
          )}
          {eps != null && (
            <span
              className={`font-mono text-[11px] hidden lg:block ${eps < 10 ? "text-[#ff4757]" : "text-[#8b8b9a]"}`}
            >
              {eps.toFixed(1)} eps
            </span>
          )}
          {ingestorAge != null && (
            <span
              className={`font-mono text-[11px] hidden xl:block ${ingestorStale ? "text-[#ff4757]" : "text-[#8b8b9a]"}`}
              title="Ingestor heartbeat age"
            >
              ing {formatAgeS(ingestorAge)}
            </span>
          )}
          {apiLatencyMs != null && (
            <span
              className={`font-mono text-[11px] hidden xl:block ${apiStale ? "text-[#ff4757]" : "text-[#8b8b9a]"}`}
              title="API round-trip latency"
            >
              {apiLatencyMs}ms
            </span>
          )}
          <Pulse active={isFetching > 0} />
          {lastUpdateSec != null && (
            <span className="text-[10px] text-[#555566] font-mono hidden sm:block whitespace-nowrap">
              {lastUpdateSec}s ago
            </span>
          )}
        </div>
      </header>

      {/* ── Mobile tabs (<768px) ── */}
      <div className="sm:hidden border-b border-[#1f1f2e] flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`flex-1 py-2 text-[11px] font-semibold tracking-wide transition-colors ${
              activeTab === tab.id
                ? "text-[#00d4aa] border-b-2 border-[#00d4aa]"
                : "text-[#8b8b9a]"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Mobile single-panel view ── */}
      <div className="sm:hidden flex-1 flex flex-col min-h-0 overflow-auto">
        {activeTab === "wallet" && <WalletCard health={health} />}
        {activeTab === "positions" && <PositionsTable health={health} />}
        {activeTab === "trades" && <ClosedTradesFeed />}
        {activeTab === "devs" && (
          <div className="flex flex-col gap-2 p-2">
            <div className="h-64"><DevsTable /></div>
            <div className="h-64"><UnknownsTable /></div>
            <div className="h-80"><ExitReasonsDonut /></div>
          </div>
        )}
        {activeTab === "system" && (
          <div className="flex flex-col min-h-0">
            <LaunchesTicker />
            <SystemHealthStrip health={health} apiLatencyMs={apiLatencyMs} />
          </div>
        )}
      </div>

      {/* ── Tablet (768–1023px): single-col with "More ▾" collapsible ── */}
      <div className="hidden sm:flex md:hidden flex-col flex-1 min-h-0 overflow-auto">
        {/* Primary modules */}
        <div style={{ height: "260px" }}>
          <WalletCard health={health} />
        </div>
        <div style={{ height: "320px" }} className="border-t border-[#1f1f2e]">
          <PositionsTable health={health} />
        </div>
        <div style={{ height: "340px" }} className="border-t border-[#1f1f2e]">
          <ClosedTradesFeed />
        </div>
        <div className="border-t border-[#1f1f2e]" style={{ height: "48px" }}>
          <LaunchesTicker />
        </div>

        {/* More ▾ collapsible */}
        <div className="border-t border-[#1f1f2e]">
          <button
            className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-semibold text-[#8b8b9a] hover:text-[#e8e8f0] transition-colors"
            onClick={() => setMoreOpen((o) => !o)}
          >
            <span>MORE</span>
            {moreOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        {moreOpen && (
          <div className="flex flex-col gap-0 border-t border-[#1f1f2e]">
            <div style={{ height: "320px" }}><ExitReasonsDonut /></div>
            <div style={{ height: "280px" }} className="border-t border-[#1f1f2e]"><DevsTable /></div>
            <div style={{ height: "280px" }} className="border-t border-[#1f1f2e]"><UnknownsTable /></div>
          </div>
        )}

        <div className="mt-auto">
          <SystemHealthStrip health={health} apiLatencyMs={apiLatencyMs} />
        </div>
      </div>

      {/* ── Desktop (≥1024px) — 2-col at 1024–1439, 12-col at ≥1440 ── */}
      <div className="hidden md:flex flex-col flex-1 min-h-0">
        {/* Row 1: Wallet (4-col) + Positions (8-col) */}
        <div
          className="grid border-b border-[#1f1f2e]"
          style={{
            height: "280px",
            gridTemplateColumns: "calc(33.333%) 1fr",
          }}
        >
          <div className="border-r border-[#1f1f2e]">
            <WalletCard health={health} />
          </div>
          <div>
            <PositionsTable health={health} />
          </div>
        </div>

        {/* Row 2: Exit donut (4-col) + Closed trades (8-col) */}
        <div
          className="grid border-b border-[#1f1f2e]"
          style={{
            height: "320px",
            gridTemplateColumns: "calc(33.333%) 1fr",
          }}
        >
          <div className="border-r border-[#1f1f2e]">
            <ExitReasonsDonut />
          </div>
          <div>
            <ClosedTradesFeed />
          </div>
        </div>

        {/* Row 3: Dev watchlist (6-col) + Top unknowns (6-col) */}
        <div
          className="grid border-b border-[#1f1f2e]"
          style={{
            height: "260px",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <div className="border-r border-[#1f1f2e]">
            <DevsTable />
          </div>
          <div>
            <UnknownsTable />
          </div>
        </div>

        {/* Row 4: Launches ticker (full width) */}
        <LaunchesTicker />

        {/* Row 5: System health footer */}
        <SystemHealthStrip health={health} apiLatencyMs={apiLatencyMs} />
      </div>
    </div>
  );
}
