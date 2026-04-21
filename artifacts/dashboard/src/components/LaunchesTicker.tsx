import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { formatAge } from "@/lib/format";
import type { Archetype } from "@/lib/types";

const ARCHETYPE_COLOR: Record<Archetype, string> = {
  quality_dev: "border-[#00d4aa] text-[#00d4aa]",
  whale_dev: "border-[#4488ff] text-[#4488ff]",
  moderate_dev: "border-[#88aadd] text-[#88aadd]",
  serial_rugger: "border-[#ff4757] text-[#ff4757]",
  bot_cluster: "border-[#ffaa00] text-[#ffaa00]",
  unknown: "border-[#8b8b9a] text-[#8b8b9a]",
};

export function LaunchesTicker() {
  const { data: launches = [] } = useQuery({
    queryKey: ["recentLaunches"],
    queryFn: () => api.recentLaunches(30),
    refetchInterval: 5000,
    staleTime: 0,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="bg-[#12121a] border border-[#1f1f2e] h-12 overflow-hidden relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute left-0 top-0 h-full flex items-center px-2">
        <span className="text-[10px] font-semibold tracking-widest uppercase text-[#8b8b9a] whitespace-nowrap z-10 bg-[#12121a] pr-2">
          LAUNCHES
        </span>
      </div>
      <div
        ref={scrollRef}
        className="flex items-center gap-3 h-full pl-24 pr-4"
        style={{
          animation: paused
            ? "none"
            : "ticker-scroll 60s linear infinite",
          whiteSpace: "nowrap",
        }}
      >
        {launches.concat(launches).map((l, i) => {
          const arch = l.archetype;
          const colorClass = arch ? ARCHETYPE_COLOR[arch] : "border-[#2a2a2a] text-[#8b8b9a]";
          return (
            <a
              key={`${l.mint}-${i}`}
              href={`https://pump.fun/coin/${l.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 border rounded-sm text-[11px] font-mono hover:bg-[#16161f] transition-colors ${colorClass}`}
            >
              <span className="font-bold">{l.symbol ?? l.mint.slice(0, 6)}</span>
              <span className="text-[#8b8b9a]">{l.creator ? l.creator.slice(0, 4) + "…" : ""}</span>
              <span className="text-[#555566]">{formatAge(l.created_at)}</span>
              {arch && arch !== "unknown" && (
                <span className={`text-[9px] ${colorClass.split(" ").pop()}`}>
                  {arch.replace(/_/g, " ")}
                </span>
              )}
            </a>
          );
        })}
      </div>
      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
