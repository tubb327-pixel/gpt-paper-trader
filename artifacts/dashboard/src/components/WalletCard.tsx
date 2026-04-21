import { useQuery } from "@tanstack/react-query";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import {
  formatSol,
  lamToSol,
  formatUsd,
  formatPct,
  shortPubkey,
} from "@/lib/format";
import type { SystemHealth } from "@/lib/types";

interface WalletCardProps {
  health: SystemHealth | undefined;
}

export function WalletCard({ health }: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const { data: wallet, isError, error } = useQuery({
    queryKey: ["wallet"],
    queryFn: api.wallet,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const solUsd = health?.sol_usd ?? 0;

  function copyPubkey() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet.pubkey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const solBalance = wallet ? lamToSol(wallet.sol_balance_lam) : null;
  const pnlSol = wallet ? lamToSol(wallet.cum_pnl_lam) : null;
  const pnlPct =
    wallet && wallet.initial_bankroll_lam > 0
      ? (wallet.cum_pnl_lam / wallet.initial_bankroll_lam) * 100
      : null;

  const pnlPositive = (pnlSol ?? 0) >= 0;

  return (
    <Card title="Wallet" className="h-full">
      {isError && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a1010] border-b border-[#ff4757] text-[#ff4757] text-[11px]">
          <AlertTriangle size={12} />
          <span>
            Fetch error — {error instanceof Error ? error.message : "network error"}. Using last known values.
          </span>
        </div>
      )}
      <div className="px-3 py-3 space-y-3">
        {wallet && (
          <div className="flex items-center gap-2 text-[#8b8b9a]">
            <span className="font-mono text-[11px]">{shortPubkey(wallet.pubkey)}</span>
            <button onClick={copyPubkey} className="hover:text-[#e8e8f0] transition-colors">
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        )}

        <div>
          <div className="text-[11px] text-[#8b8b9a] mb-0.5">SOL BALANCE</div>
          <div className="font-mono text-4xl font-bold text-white tabular-nums">
            {solBalance != null ? formatSol(wallet!.sol_balance_lam) : "—"}
          </div>
          <div className="font-mono text-sm text-[#8b8b9a] tabular-nums">
            {solBalance != null && solUsd > 0
              ? `≈ ${formatUsd(solBalance * solUsd)}`
              : ""}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-[#8b8b9a] mb-0.5">REALIZED PNL</div>
          <div
            className={`font-mono text-lg font-semibold tabular-nums ${
              pnlPositive ? "text-[#00d4aa]" : "text-[#ff4757]"
            }`}
          >
            {pnlSol != null
              ? `${pnlPositive ? "+" : ""}${pnlSol.toFixed(3)} SOL`
              : "—"}
          </div>
          <div className={`font-mono text-sm tabular-nums ${pnlPositive ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
            {pnlPct != null ? formatPct(pnlPct) + " of bankroll" : ""}
            {pnlSol != null && solUsd > 0
              ? ` · ${formatUsd((pnlSol ?? 0) * solUsd)}`
              : ""}
          </div>
        </div>

        {wallet && (
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0d2a22] border border-[#1a3d30] rounded-sm">
              <span className="text-[10px] text-[#8b8b9a]">OPEN</span>
              <span className="font-mono text-sm font-semibold text-[#00d4aa]">
                {wallet.open_count}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-sm">
              <span className="text-[10px] text-[#8b8b9a]">CLOSED</span>
              <span className="font-mono text-sm font-semibold text-[#e8e8f0]">
                {wallet.closed_trades}
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
