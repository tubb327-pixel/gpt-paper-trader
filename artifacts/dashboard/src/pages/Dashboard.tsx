import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { WalletCard } from "@/components/WalletCard";
import { PositionsTable } from "@/components/PositionsTable";
import { ExitReasonsDonut } from "@/components/ExitReasonsDonut";
import { ClosedTradesFeed } from "@/components/ClosedTradesFeed";
import { DevsTable, UnknownsTable } from "@/components/DevsTable";
import { LaunchesTicker } from "@/components/LaunchesTicker";
import { SystemHealthStrip } from "@/components/SystemHealthStrip";
import { Pulse } from "@/components/ui/Pulse";
import { api } from "@/lib/api";
import { formatSol, formatPct, lamToSol } from "@/lib/format";
import { useIsFetching } from "@tanstack/react-query";

type Tab = "wallet" | "positions" | "trades" | "devs" | "system";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("positions");
  const [lastUpdateMs, setLastUpdateMs] = useState<number | null>(null);
  const isFetching = useIsFetching();

  const { data: health } = useQuery({
    queryKey: ["systemHealth"],
    queryFn: api.systemHealth,
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
    if (!isFetching) {
      setLastUpdateMs(Date.now());
    }
  }, [isFetching]);

  const pnlSol = wallet ? lamToSol(wallet.cum_pnl_lam) : null;
  const pnlPos = (pnlSol ?? 0) >= 0;
  const solBalance = wallet ? lamToSol(wallet.sol_balance_lam) : null;
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

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e8e8f0] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f] border-b border-[#1f1f2e] h-14 flex items-center px-4 gap-6">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono font-bold text-white text-lg tracking-tight">GPT</span>
          <span className="text-[10px] text-[#8b8b9a] tracking-widest hidden sm:block">
            PAPER · GCP · us-east4-c
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-6 min-w-0">
          <div className="text-center hidden md:block">
            <div className="text-[10px] text-[#8b8b9a] tracking-widest">SOL BALANCE</div>
            <div className="font-mono text-xl font-bold text-white tabular-nums">
              {solBalance != null ? formatSol(wallet!.sol_balance_lam) : "—"}
            </div>
          </div>
          {pnlSol != null && (
            <div className="text-center hidden md:block">
              <div className="text-[10px] text-[#8b8b9a] tracking-widest">CUM PNL</div>
              <div
                className={`font-mono text-lg font-semibold tabular-nums flex items-center gap-1 ${
                  pnlPos ? "text-[#00d4aa]" : "text-[#ff4757]"
                }`}
              >
                <span>{pnlPos ? "▲" : "▼"}</span>
                <span>{formatPct(pnlPct)}</span>
                <span className="text-sm">
                  {pnlPos ? "+" : ""}{pnlSol.toFixed(3)} SOL
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {health?.sol_usd && (
            <span className="font-mono text-[11px] text-[#8b8b9a] hidden sm:block">
              SOL ${health.sol_usd.toFixed(0)}
            </span>
          )}
          <Pulse active={isFetching > 0} />
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden border-b border-[#1f1f2e] flex">
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

      {/* Mobile single-panel view */}
      <div className="md:hidden flex-1 flex flex-col min-h-0">
        {activeTab === "wallet" && (
          <div className="flex-1 min-h-0">
            <WalletCard health={health} />
          </div>
        )}
        {activeTab === "positions" && (
          <div className="flex-1 min-h-0">
            <PositionsTable health={health} />
          </div>
        )}
        {activeTab === "trades" && (
          <div className="flex-1 min-h-0">
            <ClosedTradesFeed />
          </div>
        )}
        {activeTab === "devs" && (
          <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-auto p-2">
            <div className="h-64"><DevsTable /></div>
            <div className="h-64"><UnknownsTable /></div>
            <div className="h-36"><ExitReasonsDonut /></div>
          </div>
        )}
        {activeTab === "system" && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1">
              <LaunchesTicker />
            </div>
            <SystemHealthStrip health={health} lastUpdateMs={lastUpdateMs} />
          </div>
        )}
      </div>

      {/* Desktop / tablet layout */}
      <div className="hidden md:flex flex-1 flex-col min-h-0">
        {/* Row 1: Wallet + Positions */}
        <div className="grid grid-cols-12 gap-0 border-b border-[#1f1f2e]" style={{ height: "280px" }}>
          <div className="col-span-12 lg:col-span-4 border-r border-[#1f1f2e]">
            <WalletCard health={health} />
          </div>
          <div className="col-span-12 lg:col-span-8">
            <PositionsTable health={health} />
          </div>
        </div>

        {/* Row 2: Exit donut + Closed trades */}
        <div className="grid grid-cols-12 gap-0 border-b border-[#1f1f2e]" style={{ height: "320px" }}>
          <div className="col-span-12 lg:col-span-4 border-r border-[#1f1f2e]">
            <ExitReasonsDonut />
          </div>
          <div className="col-span-12 lg:col-span-8">
            <ClosedTradesFeed />
          </div>
        </div>

        {/* Row 3: Dev watchlist + Top unknowns */}
        <div className="grid grid-cols-12 gap-0 border-b border-[#1f1f2e]" style={{ height: "280px" }}>
          <div className="col-span-12 lg:col-span-6 border-r border-[#1f1f2e]">
            <DevsTable />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <UnknownsTable />
          </div>
        </div>

        {/* Row 4: Launches ticker */}
        <LaunchesTicker />

        {/* Row 5: System health footer */}
        <SystemHealthStrip health={health} lastUpdateMs={lastUpdateMs} />
      </div>
    </div>
  );
}
