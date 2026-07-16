import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  STATE_KEY,
  VERSION_KEY,
  bearerToken,
  getRedis,
  verifyToken,
} from "./_auth.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const user = verifyToken(bearerToken(req));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const redis = getRedis();

    if (req.method === "GET") {
      const [state, version] = await Promise.all([
        redis.get(STATE_KEY),
        redis.get(VERSION_KEY),
      ]);
      res.status(200).json({ state: state ?? null, version: Number(version) || 0 });
      return;
    }

    if (req.method === "PUT") {
      const body = (req.body || {}) as { state?: unknown; version?: number };
      const clientVersion = Number(body.version) || 0;
      const currentVersion = Number(await redis.get(VERSION_KEY)) || 0;

      if (clientVersion !== currentVersion) {
        const currentState = await redis.get(STATE_KEY);
        res.status(409).json({
          ok: false,
          state: currentState ?? null,
          version: currentVersion,
        });
        return;
      }

      const newVersion = currentVersion + 1;
      await redis.set(STATE_KEY, body.state ?? null);
      await redis.set(VERSION_KEY, newVersion);
      res.status(200).json({ ok: true, version: newVersion });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Server error" });
  }
}
