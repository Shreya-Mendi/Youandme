import type { PersonId } from "../types";

export interface SessionUser {
  id: string;
  name: string;
  /** Stable identity slot → drives self/partner colors across both devices. */
  person: PersonId;
}

export interface Session {
  token: string;
  user: SessionUser;
}

const SESSION_KEY = "unme:session";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (
      parsed &&
      typeof parsed.token === "string" &&
      parsed.user &&
      typeof parsed.user.id === "string" &&
      (parsed.user.person === "you" || parsed.user.person === "partner")
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors; the in-memory session still works this session.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore.
  }
}

export async function apiLogin(name: string, pass: string): Promise<Session> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, pass }),
  });
  if (!res.ok) {
    let message = "Login failed";
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // Non-JSON error (e.g. no backend running locally).
      message =
        res.status === 404
          ? "No backend found — deploy to Vercel to log in."
          : `Login failed (${res.status})`;
    }
    throw new Error(message);
  }
  const data = (await res.json()) as Session;
  return { token: data.token, user: data.user };
}
