import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from "chart.js";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { formatPct } from "@/lib/format";

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

const REASON_COLORS: Record<string, string> = {
  rugged: "#cc2233",
  sl_hit: "#ff6633",
  honeypot: "#ff9944",
  timeout: "#555566",
  no_data: "#443344",
  trail_stop: "#00d4aa",
  profit_target: "#00c49a",
  manual: "#4488cc",
};

function getColor(reason: string | null): string {
  const key = reason ?? "unknown";
  return REASON_COLORS[key] ?? "#00d4aa";
}

export function ExitReasonsDonut() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const { data: reasons = [], isError, error } = useQuery({
    queryKey: ["exitReasons"],
    queryFn: api.exitReasons,
    refetchInterval: 5000,
    staleTime: 0,
  });

  const sorted = [...reasons].sort(
    (a, b) => (b.total_pnl_sol ?? 0) - (a.total_pnl_sol ?? 0)
  );

  useEffect(() => {
    if (!canvasRef.current || reasons.length === 0) return;
    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: reasons.map((r) => r.exit_reason ?? "unknown"),
        datasets: [
          {
            data: reasons.map((r) => r.n),
            backgroundColor: reasons.map((r) => getColor(r.exit_reason)),
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#12121a",
            borderColor: "#1f1f2e",
            borderWidth: 1,
            titleColor: "#e8e8f0",
            bodyColor: "#8b8b9a",
            callbacks: {
              label: (ctx) => {
                const row = reasons[ctx.dataIndex];
                return [
                  `Count: ${row.n}`,
                  `PnL: ${row.total_pnl_sol?.toFixed(3) ?? "—"} SOL`,
                  `Avg: ${formatPct(row.avg_return_pct ?? null)}`,
                ];
              },
            },
          },
        },
        cutout: "65%",
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [reasons]);

  return (
    <Card title="Exit Mix (All-Time)" className="h-full">
      {isError && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2a1010] border-b border-[#ff4757] text-[#ff4757] text-[11px]">
          <AlertTriangle size={12} />
          <span>{error instanceof Error ? error.message : "fetch error"} — showing last values</span>
        </div>
      )}
      <div className="px-3 py-3 flex flex-col gap-3 h-full">
        {reasons.length === 0 ? (
          <div className="text-[#8b8b9a] text-sm text-center py-6">No data</div>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="w-36 h-36">
                <canvas ref={canvasRef} />
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="text-[#8b8b9a] border-b border-[#1f1f2e]">
                    <th className="py-1 text-left font-medium">Reason</th>
                    <th className="py-1 text-right font-medium">N</th>
                    <th className="py-1 text-right font-medium">PnL SOL</th>
                    <th className="py-1 text-right font-medium">Avg%</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => {
                    const pnlPos = (row.total_pnl_sol ?? 0) >= 0;
                    return (
                      <tr
                        key={row.exit_reason ?? "null"}
                        className="border-b border-[#1f1f2e] hover:bg-[#16161f]"
                      >
                        <td className="py-1 flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0 inline-block"
                            style={{ background: getColor(row.exit_reason) }}
                          />
                          <span className="font-mono text-[#e8e8f0]">
                            {row.exit_reason ?? "unknown"}
                          </span>
                        </td>
                        <td className="py-1 text-right font-mono text-[#e8e8f0] tabular-nums">{row.n}</td>
                        <td className={`py-1 text-right font-mono tabular-nums ${pnlPos ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                          {row.total_pnl_sol != null
                            ? `${pnlPos ? "+" : ""}${row.total_pnl_sol.toFixed(3)}`
                            : "—"}
                        </td>
                        <td className={`py-1 text-right font-mono tabular-nums ${(row.avg_return_pct ?? 0) >= 0 ? "text-[#00d4aa]" : "text-[#ff4757]"}`}>
                          {formatPct(row.avg_return_pct ?? null)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
