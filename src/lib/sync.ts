import { useCallback, useEffect, useRef, useState } from "react";
import type { AppState, PersonId } from "../types";
import { hydrateRemoteState } from "./storage";

export type SyncStatus = "connecting" | "synced" | "offline";

const PUT_DEBOUNCE = 800;
const POLL_INTERVAL = 4000;

interface SyncParams {
  token: string;
  /** Local identity — always re-applied so it never leaks across devices. */
  me: PersonId;
  state: AppState;
  /** Replace the whole store state with a server-provided snapshot. */
  applyRemote: (state: AppState) => void;
  /** Called when the server rejects the token (logs the user out). */
  onAuthError: () => void;
}

/**
 * Two-way sync against the /api/state endpoints with optimistic concurrency.
 * Degrades gracefully to pure-localStorage mode if the backend is unreachable
 * (e.g. `vite dev` with no functions) so the app never white-screens.
 */
export function useSync({
  token,
  me,
  state,
  applyRemote,
  onAuthError,
}: SyncParams): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>("connecting");

  const serverVersionRef = useRef(0);
  const lastSyncedJsonRef = useRef("");
  const initializedRef = useRef(false);

  // Keep the latest state readable from callbacks without re-subscribing.
  const stateRef = useRef(state);
  stateRef.current = state;

  const authHeader = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const applySnapshot = useCallback(
    (rawState: unknown, version: number) => {
      serverVersionRef.current = version;
      const hydrated = hydrateRemoteState(rawState);
      if (!hydrated) return;
      const normalized: AppState = { ...hydrated, currentPerson: me };
      lastSyncedJsonRef.current = JSON.stringify(normalized);
      applyRemote(normalized);
    },
    [applyRemote, me]
  );

  const push = useCallback(async () => {
    const current = stateRef.current;
    const normalized: AppState = { ...current, currentPerson: me };
    const json = JSON.stringify(normalized);
    if (json === lastSyncedJsonRef.current) return;
    try {
      const res = await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          state: normalized,
          version: serverVersionRef.current,
        }),
      });
      if (res.status === 401) {
        onAuthError();
        return;
      }
      if (res.status === 409) {
        const data = await res.json();
        applySnapshot(data.state, data.version || 0);
        setStatus("synced");
        return;
      }
      if (!res.ok) throw new Error(`PUT failed (${res.status})`);
      const data = await res.json();
      serverVersionRef.current = data.version || serverVersionRef.current;
      lastSyncedJsonRef.current = json;
      setStatus("synced");
    } catch {
      setStatus("offline");
    }
  }, [applySnapshot, authHeader, me, onAuthError]);

  const pushRef = useRef(push);
  pushRef.current = push;

  // Initial load: hydrate from server, or seed the server with local state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("connecting");
      try {
        const res = await fetch("/api/state", { headers: authHeader() });
        if (res.status === 401) {
          onAuthError();
          return;
        }
        if (!res.ok) throw new Error(`GET failed (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        if (data.state) {
          applySnapshot(data.state, data.version || 0);
          initializedRef.current = true;
          setStatus("synced");
        } else {
          serverVersionRef.current = data.version || 0;
          initializedRef.current = true;
          setStatus("synced");
          void pushRef.current();
        }
      } catch {
        if (cancelled) return;
        initializedRef.current = true;
        setStatus("offline");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Debounced push whenever local state changes post-initialization.
  useEffect(() => {
    if (!initializedRef.current) return;
    const id = setTimeout(() => void pushRef.current(), PUT_DEBOUNCE);
    return () => clearTimeout(id);
  }, [state]);

  // Poll: pull newer server versions in.
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/state", { headers: authHeader() });
        if (res.status === 401) {
          onAuthError();
          return;
        }
        if (!res.ok) throw new Error(`GET failed (${res.status})`);
        const data = await res.json();
        const version = data.version || 0;
        if (version > serverVersionRef.current) {
          applySnapshot(data.state, version);
        }
        setStatus("synced");
      } catch {
        setStatus("offline");
      }
    }, POLL_INTERVAL);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return status;
}
