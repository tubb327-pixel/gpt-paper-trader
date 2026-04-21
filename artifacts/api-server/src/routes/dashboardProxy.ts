import { type Express } from "express";
import { logger } from "../lib/logger";

const UPSTREAM =
  process.env["DASHBOARD_UPSTREAM_URL"]?.trim() ||
  "https://snipesatbig.tubbsgrabberbrah.us";

export function registerDashboardProxy(app: Express) {
  app.use("/dashboard-proxy", async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const token = process.env["DASHBOARD_API_TOKEN"];
    if (!token) {
      res.status(500).json({
        error: "DASHBOARD_API_TOKEN is not set. Add it in Replit Secrets.",
      });
      return;
    }

    const subPath = req.path ?? "";
    const qs = Object.keys(req.query).length
      ? "?" + new URLSearchParams(req.query as Record<string, string>).toString()
      : "";
    const upstreamUrl = `${UPSTREAM}${subPath}${qs}`;

    try {
      const upstream = await fetch(upstreamUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const body = await upstream.text();
      const contentType =
        upstream.headers.get("content-type") ?? "application/json";

      res.status(upstream.status).header("Content-Type", contentType).send(body);
    } catch (err) {
      logger.error({ err, upstreamUrl }, "Dashboard proxy fetch failed");
      res.status(502).json({ error: "Upstream API unavailable" });
    }
  });
}
