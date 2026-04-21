const LAM = 1e9;

export function lamToSol(lam: number): number {
  return lam / LAM;
}

export function formatSol(lam: number): string {
  return (lam / LAM).toFixed(3);
}

export function formatSolRaw(sol: number): string {
  return sol.toFixed(3);
}

export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(2)}`;
}

export function formatPct(pct: number | null): string {
  if (pct == null) return "—";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function priceToMcUsd(price: number, solUsd: number): number {
  return price * 1e6 * solUsd;
}

export function formatMc(price: number, solUsd: number): string {
  return formatUsd(priceToMcUsd(price, solUsd));
}

export function formatAge(isoTs: string): string {
  const diffMs = Date.now() - new Date(isoTs).getTime();
  const totalSec = Math.floor(diffMs / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

export function formatAgeS(ageS: number): string {
  if (ageS < 60) return `${Math.floor(ageS)}s`;
  const m = Math.floor(ageS / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const CT_OFFSET = -6 * 60;

export function toCST(isoTs: string): Date {
  const d = new Date(isoTs);
  return new Date(d.getTime() + CT_OFFSET * 60 * 1000);
}

export function formatTimeCst(isoTs: string): string {
  const d = toCST(isoTs);
  const h = d.getUTCHours().toString().padStart(2, "0");
  const m = d.getUTCMinutes().toString().padStart(2, "0");
  const s = d.getUTCSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function formatDateGroupCst(isoTs: string): string {
  const d = toCST(isoTs);
  const today = toCST(new Date().toISOString());
  const yesterday = new Date(today.getTime() - 86400000);

  const sameDay = (a: Date, b: Date) =>
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate();

  if (sameDay(d, today)) return "TODAY";
  if (sameDay(d, yesterday)) return "YESTERDAY";

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function shortPubkey(pubkey: string): string {
  if (pubkey.length <= 12) return pubkey;
  return `${pubkey.slice(0, 6)}…${pubkey.slice(-6)}`;
}

export function shortCreator(creator: string | null): string {
  if (!creator) return "—";
  return shortPubkey(creator);
}
