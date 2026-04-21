import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { formatAge } from "@/lib/format";
import type { Archetype } from "@/lib/types";

const ARCHETYPE_COLOR: Partial<Record<Archetype, string>> = {
  quality_dev: "border-[#00d4aa] text-[#00d4aa]",
  whale_dev: "border-[#4488ff] text-[#4488ff]",
  moderate_dev: "border-[#88aadd] text-[#88aadd]",
  serial_rugger: "border-[#ff4757] text-[#ff4757]",
  bot_cluster: "border-[#ffaa00] text-[#ffaa00]",
};

export function LaunchesTicker() {
  const { data: launches = [], isError, error } = useQuery({
    queryKey: ["recentLaunches"],
    queryFn: () => api.recentLaunches(30),
    refetchInterval: 5000,
    staleTime: 0,
  });

  const [paused, setPaused] = useState(false);
  const tiles = launches.concat(launches);

  return (
    <div
      className="bg-[#12121a] border-b border-[#1f1f2e] flex-shrink-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {isError && (
        <div className="flex items-center gap-1.5 px-3 py-0.5 bg-[#2a1010] border-b border-[#ff4757] text-[#ff4757] text-[10px]">
          <AlertTriangle size={10} />
          <span>
            {error instanceof Error ? error.message : "fetch error"} — showing last values
          </span>
        </div>
      )}
      <div className="h-12 overflow-hidden relative">
        <div className="absolute left-0 top-0 h-full flex items-center px-2 z-10 bg-[#12121a] border-r border-[#1f1f2e]">
          <span className="text-[10px] font-semibold tracking-widest uppercase text-[#8b8b9a] whitespace-nowrap pr-2">
            LAUNCHES
          </span>
        </div>
        <div
          className="flex items-center gap-3 h-full pl-28 pr-4"
          style={{
            animation:
              paused || tiles.length === 0
                ? "none"
                : "ticker-scroll 60s linear infinite",
            whiteSpace: "nowrap",
          }}
        >
          {tiles.length === 0 ? (
            <span className="text-[11px] text-[#8b8b9a]">No recent launches</span>
          ) : (
            tiles.map((l, i) => {
              const arch = l.archetype;
              const colorClass =
                arch && arch !== "unknown"
                  ? ARCHETYPE_COLOR[arch] ?? "border-[#2a2a2a] text-[#8b8b9a]"
                  : "border-[#2a2a2a] text-[#8b8b9a]";
              return (
                <a
                  key={`${l.mint}-${i}`}
                  href={`https://pump.fun/coin/${l.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-sm text-[11px] font-mono hover:bg-[#16161f] transition-colors ${colorClass}`}
                >
                  <span className="font-bold">{l.symbol ?? l.mint.slice(0, 6)}</span>
                  {l.creator && (
                    <span className="text-[#555566]">{l.creator.slice(0, 4)}…</span>
                  )}
                  <span className="text-[#555566]">{formatAge(l.created_at)}</span>
                  {arch && arch !== "unknown" && (
                    <span className="text-[9px] opacity-70">
                      {arch.replace(/_/g, " ")}
                    </span>
                  )}
                </a>
              );
            })
          )}
        </div>
        <style>{`
          @keyframes ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </div>
  );
}
