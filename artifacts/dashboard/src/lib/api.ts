import type {
  Wallet,
  Position,
  ClosedTrade,
  ExitReasonRow,
  DevRow,
  LaunchRow,
  SystemHealth,
} from "./types";

const BASE = "/dashboard-proxy";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  wallet: () => getJSON<Wallet>("/api/wallet"),
  positions: () => getJSON<Position[]>("/api/positions"),
  closedTrades: (limit = 50) =>
    getJSON<ClosedTrade[]>(`/api/trades/closed?limit=${limit}`),
  exitReasons: () => getJSON<ExitReasonRow[]>("/api/exit-reasons"),
  devs: () => getJSON<DevRow[]>("/api/devs"),
  unknowns: (limit = 25) =>
    getJSON<DevRow[]>(`/api/unknowns?limit=${limit}`),
  recentLaunches: (minutes = 30) =>
    getJSON<LaunchRow[]>(`/api/launches/recent?minutes=${minutes}`),
  systemHealth: () => getJSON<SystemHealth>("/api/system/health"),
};
