import { useEffect, useRef } from "react";
import { formatAgeS } from "@/lib/format";
import type { SystemHealth } from "@/lib/types";

interface HealthAlertBannerProps {
  health: SystemHealth | undefined;
}

interface Alert {
  key: string;
  message: string;
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
    });
  }

  if (telegramAge != null && telegramAge > 120) {
    alerts.push({
      key: "telegram",
      message: `Telegram bot heartbeat stale — last seen ${formatAgeS(telegramAge)} ago`,
    });
  }

  if (eps != null && eps < 10) {
    alerts.push({
      key: "eps",
      message: `Low event rate — ${eps.toFixed(1)} eps (expected ≥ 10)`,
    });
  }

  return alerts;
}

function useHealthAlertNotifications(health: SystemHealth | undefined) {
  const prevKeysRef = useRef<Set<string> | null>(null);
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    if (health === undefined) return;
    if (!("Notification" in window)) return;

    const alerts = computeAlerts(health);
    const currentKeys = new Set(alerts.map((a) => a.key));

    if (prevKeysRef.current === null) {
      prevKeysRef.current = currentKeys;
      return;
    }

    const prevKeys = prevKeysRef.current;
    const newAlerts = alerts.filter((a) => !prevKeys.has(a.key));
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
  }, [health]);
}

export function HealthAlertBanner({ health }: HealthAlertBannerProps) {
  const alerts = computeAlerts(health);

  useHealthAlertNotifications(health);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-[#2a1015] border-b border-[#ff4757]/40 px-4 py-1.5 flex items-center gap-3 flex-wrap">
      <span className="text-[#ff4757] text-[10px] font-bold tracking-widest uppercase flex-shrink-0">
        ⚠ Alert
      </span>
      <div className="flex items-center gap-4 flex-wrap min-w-0">
        {alerts.map((alert) => (
          <span key={alert.key} className="font-mono text-[11px] text-[#ff8a94]">
            {alert.message}
          </span>
        ))}
      </div>
    </div>
  );
}
