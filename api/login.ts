import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUsers, signToken } from "./_auth";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body = (req.body || {}) as { name?: string; pass?: string };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const pass = typeof body.pass === "string" ? body.pass : "";
    if (!name || !pass) {
      res.status(400).json({ error: "Name and password are required" });
      return;
    }

    const users = getUsers();
    const match = users.find(
      (u) => u.name.toLowerCase() === name.toLowerCase() && u.pass === pass
    );
    if (!match) {
      res.status(401).json({ error: "That name and password don't match." });
      return;
    }

    const index = users.findIndex((u) => u.id === match.id);
    const person = index === 0 ? "you" : "partner";
    const token = signToken({ id: match.id, name: match.name });
    res
      .status(200)
      .json({ token, user: { id: match.id, name: match.name, person } });
  } catch (err) {
    res
      .status(500)
      .json({ error: err instanceof Error ? err.message : "Server error" });
  }
}
