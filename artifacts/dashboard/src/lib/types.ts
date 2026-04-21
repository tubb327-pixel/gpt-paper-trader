export type Archetype =
  | "quality_dev"
  | "whale_dev"
  | "moderate_dev"
  | "serial_rugger"
  | "bot_cluster"
  | "unknown";

export interface Wallet {
  pubkey: string;
  sol_balance_lam: number;
  cum_pnl_lam: number;
  closed_trades: number;
  initial_bankroll_lam: number;
  open_count: number;
  updated_at: string;
}

export interface Position {
  launch_id: string;
  mint: string;
  symbol: string | null;
  archetype: Archetype | null;
  entry_price: number;
  current_price: number | null;
  sol_in_lamports: number | null;
  entry_at: string;
}

export interface ClosedTrade {
  launch_id: string;
  mint: string;
  symbol: string | null;
  archetype: Archetype | null;
  entry_at: string;
  exit_at: string | null;
  exit_reason: string | null;
  entry_price: number;
  exit_price: number | null;
  peak_return_pct: number | null;
  return_pct: number | null;
  sol_pnl: number | null;
}

export interface ExitReasonRow {
  exit_reason: string | null;
  n: number;
  total_pnl_sol: number | null;
  avg_return_pct: number | null;
}

export interface DevRow {
  label: string | null;
  archetype: Archetype;
  total_launches: number;
  total_migrations: number;
  migration_rate: number | null;
  prior_score: number | null;
  recent_migrations_7d: number;
}

export interface LaunchRow {
  mint: string;
  symbol: string | null;
  name: string | null;
  creator: string | null;
  created_at: string;
  archetype: Archetype | null;
}

export interface SystemHealth {
  events_per_sec_60s: number | null;
  ingestor_heartbeat_age_s: number | null;
  telegram_bot_heartbeat_age_s: number | null;
  sol_usd: number | null;
  sol_usd_cache_age_s: number | null;
  launches_5m: number;
  score_events_5m: number;
}
