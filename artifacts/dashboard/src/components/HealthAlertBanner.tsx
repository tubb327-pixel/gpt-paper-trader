import { useCallback, useEffect, useRef, useState } from "react";
import { formatAgeS } from "@/lib/format";
import type { SystemHealth } from "@/lib/types";

interface HealthAlertBannerProps {
  health: SystemHealth | undefined;
}

interface Alert {
  key: string;
  message: string;
  severity: number;
}

interface SnoozeEntry {
  expiresAt: number;
  severityAtSnooze: number;
}

type SnoozeMap = Record<string, SnoozeEntry>;

const SNOOZE_LS_KEY = "health-alert-snooze-v1";
const SNOOZE_DURATION_MS = 60 * 60 * 1000;

function loadSnoozes(): SnoozeMap {
  try {
    const raw = JSON.parse(localStorage.getItem(SNOOZE_LS_KEY) ?? "{}");
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
    const validated: SnoozeMap = {};
    for (const [key, val] of Object.entries(raw)) {
      if (
        val !== null &&
        typeof val === "object" &&
        typeof (val as SnoozeEntry).expiresAt === "number" &&
        typeof (val as SnoozeEntry).severityAtSnooze === "number"
      ) {
        validated[key] = val as SnoozeEntry;
      }
    }
    return validated;
  } catch {
    return {};
  }
}

function saveSnoozes(snoozes: SnoozeMap) {
  localStorage.setItem(SNOOZE_LS_KEY, JSON.stringify(snoozes));
}

function hasConditionWorsened(key: string, current: number, atSnooze: number): boolean {
  if (key === "eps") {
    return current < atSnooze;
  }
  return current > atSnooze;
}

function isAlertSnoozed(key: string, severity: number, snoozes: SnoozeMap): boolean {
  const entry = snoozes[key];
  if (!entry) return false;
  if (Date.now() >= entry.expiresAt) return false;
  if (hasConditionWorsened(key, severity, entry.severityAtSnooze)) return false;
  return true;
}

function computeAlerts(health: SystemHealth | undefined): Alert[] {
  const alerts: Alert[] = [];

  const ingestorAge = health?.ingestor_heartbeat_age_s ?? null;
  const telegramAge = health?.telegram_bot_heartbeat_age_s ?? null;
  const eps = health?.events_per_sec_60s ?? null;

  if (ingestorAge != null && ingestorAge > 120) {
    alerts.push({
      key: "ingestor",
      message: `Ingestor heartbeat stale — last seen ${formatAgeS(ingestorAge)} ago`,
      severity: ingestorAge,
    });
  }

  if (telegramAge != null && telegramAge > 120) {
    alerts.push({
      key: "telegram",
      message: `Telegram bot heartbeat stale — last seen ${formatAgeS(telegramAge)} ago`,
      severity: telegramAge,
    });
  }

  if (eps != null && eps < 10) {
    alerts.push({
      key: "eps",
      message: `Low event rate — ${eps.toFixed(1)} eps (expected ≥ 10)`,
      severity: eps,
    });
  }

  return alerts;
}

function useAlertSnooze() {
  const [snoozes, setSnoozes] = useState<SnoozeMap>(loadSnoozes);

  useEffect(() => {
    const id = setInterval(() => {
      setSnoozes(loadSnoozes());
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  const snoozeAlert = useCallback((key: string, severity: number) => {
    setSnoozes((prev) => {
      const next: SnoozeMap = {
        ...prev,
        [key]: {
          expiresAt: Date.now() + SNOOZE_DURATION_MS,
          severityAtSnooze: severity,
        },
      };
      saveSnoozes(next);
      return next;
    });
  }, []);

  return { snoozes, snoozeAlert };
}

function useHealthAlertNotifications(health: SystemHealth | undefined, snoozes: SnoozeMap) {
  const prevKeysRef = useRef<Set<string> | null>(null);
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    if (health === undefined) return;
    if (!("Notification" in window)) return;

    const alerts = computeAlerts(health);
    const visibleAlerts = alerts.filter((a) => !isAlertSnoozed(a.key, a.severity, snoozes));
    const currentKeys = new Set(visibleAlerts.map((a) => a.key));

    if (prevKeysRef.current === null) {
      prevKeysRef.current = currentKeys;
      return;
    }

    const prevKeys = prevKeysRef.current;
    const newAlerts = visibleAlerts.filter((a) => !prevKeys.has(a.key));
    prevKeysRef.current = currentKeys;

    if (newAlerts.length === 0) return;

    const fireNotifications = () => {
      newAlerts.forEach((alert) => {
        new Notification("GPT Paper Trader — Health Alert", {
          body: alert.message,
          icon: "/favicon.ico",
          tag: alert.key,
        });
      });
    };

    if (Notification.permission === "granted") {
      fireNotifications();
    } else if (
      Notification.permission === "default" &&
      !permissionRequestedRef.current
    ) {
      permissionRequestedRef.current = true;
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          fireNotifications();
        }
      });
    }
  }, [health, snoozes]);
}

export function HealthAlertBanner({ health }: HealthAlertBannerProps) {
  const { snoozes, snoozeAlert } = useAlertSnooze();
  const allAlerts = computeAlerts(health);
  const visibleAlerts = allAlerts.filter((a) => !isAlertSnoozed(a.key, a.severity, snoozes));

  useHealthAlertNotifications(health, snoozes);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="bg-[#2a1015] border-b border-[#ff4757]/40 px-4 py-1.5 flex items-center gap-3 flex-wrap">
      <span className="text-[#ff4757] text-[10px] font-bold tracking-widest uppercase flex-shrink-0">
        ⚠ Alert
      </span>
      <div className="flex items-center gap-4 flex-wrap min-w-0">
        {visibleAlerts.map((alert) => (
          <span key={alert.key} className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#ff8a94]">
              {alert.message}
            </span>
            <button
              onClick={() => snoozeAlert(alert.key, alert.severity)}
              className="text-[10px] font-mono text-[#ff4757]/70 hover:text-[#ff4757] border border-[#ff4757]/30 hover:border-[#ff4757]/60 rounded px-1.5 py-0.5 transition-colors flex-shrink-0"
              title="Hide this alert for 1 hour"
            >
              Snooze 1h
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
