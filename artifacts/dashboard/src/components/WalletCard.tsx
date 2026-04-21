import { useQuery } from "@tanstack/react-query";
import { Copy, Check, AlertTriangle } from "lucide-react";
import { useState, useMemo, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/DashCard";
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

interface SparklinePoint {
  value: number;
  time: Date;
}

function PnlSparkline({ points }: { points: SparklinePoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (points.length < 2) return null;

  const W = 120;
  const H = 32;
  const PAD = 2;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xs = values.map((_, i) => PAD + (i / (values.length - 1)) * (W - PAD * 2));
  const ys = values.map((v) => PAD + (1 - (v - min) / range) * (H - PAD * 2));

  const polyline = xs.map((x, i) => `${x},${ys[i]}`).join(" ");

  const trending = values[values.length - 1] >= values[0];
  const color = trending ? "#00d4aa" : "#ff4757";

  const areaPoints = [
    `${xs[0]},${H}`,
    ...xs.map((x, i) => `${x},${ys[i]}`),
    `${xs[xs.length - 1]},${H}`,
  ].join(" ");

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;
      let closest = 0;
      let minDist = Infinity;
      xs.forEach((x, i) => {
        const dist = Math.abs(x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setHoveredIndex(closest);
    },
    [xs],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null;
  const hx = hoveredIndex !== null ? xs[hoveredIndex] : null;
  const hy = hoveredIndex !== null ? ys[hoveredIndex] : null;

  const tooltipLabel =
    hovered != null
      ? `${hovered.value >= 0 ? "+" : ""}${hovered.value.toFixed(3)} SOL`
      : null;

  const tooltipTime =
    hovered != null
      ? hovered.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;

  const TOOLTIP_W = 72;
  const TOOLTIP_H = 24;
  const tooltipX =
    hx != null ? Math.min(Math.max(hx - TOOLTIP_W / 2, 0), W - TOOLTIP_W) : 0;
  const tooltipY = hy != null ? hy - TOOLTIP_H - 5 : 0;

  return (
    <svg
      ref={svgRef}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible cursor-crosshair"
      aria-hidden="true"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <polygon points={areaPoints} fill={color} fillOpacity={0.12} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {hoveredIndex !== null && hx != null && hy != null && (
        <>
          <line
            x1={hx}
            y1={PAD}
            x2={hx}
            y2={H - PAD}
            stroke={color}
            strokeWidth={0.75}
            strokeDasharray="2 2"
            opacity={0.6}
          />
          <circle cx={hx} cy={hy} r={2.5} fill={color} />

          <rect
            x={tooltipX}
            y={tooltipY}
            width={TOOLTIP_W}
            height={TOOLTIP_H}
            rx={3}
            fill="#1a1a2e"
            stroke={color}
            strokeWidth={0.75}
            strokeOpacity={0.6}
          />
          <text
            x={tooltipX + TOOLTIP_W / 2}
            y={tooltipY + 9}
            textAnchor="middle"
            fill={color}
            fontSize={7.5}
            fontFamily="monospace"
            fontWeight="600"
          >
            {tooltipLabel}
          </text>
          <text
            x={tooltipX + TOOLTIP_W / 2}
            y={tooltipY + 19}
            textAnchor="middle"
            fill="#8b8b9a"
            fontSize={6.5}
            fontFamily="monospace"
          >
            {tooltipTime}
          </text>
        </>
      )}
    </svg>
  );
}

const SPARKLINE_RANGES = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
] as const;

type SparklineRange = (typeof SPARKLINE_RANGES)[number]["hours"];

export function WalletCard({ health }: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const [sparklineRange, setSparklineRange] = useState<SparklineRange>(24);
  const { data: wallet, isError, error } = useQuery({
    queryKey: ["wallet"],
    queryFn: api.wallet,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const { data: closedTrades } = useQuery({
    queryKey: ["closedTrades", 500],
    queryFn: () => api.closedTrades(500),
    refetchInterval: 5000,
    staleTime: 0,
  });

  const sparklinePoints = useMemo((): SparklinePoint[] => {
    if (!closedTrades || closedTrades.length === 0) return [];
    const cutoff = Date.now() - sparklineRange * 60 * 60 * 1000;
    const recent = closedTrades
      .filter((t) => t.exit_at != null && new Date(t.exit_at).getTime() >= cutoff)
      .sort((a, b) => new Date(a.exit_at!).getTime() - new Date(b.exit_at!).getTime());
    if (recent.length < 2) return [];
    let cum = 0;
    return recent.map((t) => {
      cum += t.sol_pnl ?? 0;
      return { value: cum, time: new Date(t.exit_at!) };
    });
  }, [closedTrades, sparklineRange]);

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
          <div className="mt-2">
            <div style={{ minHeight: 32 }}>
              {sparklinePoints.length >= 2 ? (
                <PnlSparkline points={sparklinePoints} />
              ) : (
                <div className="text-[10px] text-[#8b8b9a] leading-8">no trades in window</div>
              )}
            </div>
            <div className="flex items-center justify-between mt-1">
              <div className="text-[10px] text-[#8b8b9a]">
                last {SPARKLINE_RANGES.find((r) => r.hours === sparklineRange)?.label}
              </div>
              <div className="flex gap-0.5">
                {SPARKLINE_RANGES.map(({ label, hours }) => (
                  <button
                    key={hours}
                    onClick={() => setSparklineRange(hours)}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm transition-colors ${
                      sparklineRange === hours
                        ? "bg-[#1a3d30] text-[#00d4aa] border border-[#00d4aa33]"
                        : "text-[#8b8b9a] hover:text-[#e8e8f0] border border-transparent"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
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
