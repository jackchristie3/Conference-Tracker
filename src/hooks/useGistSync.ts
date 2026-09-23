import { useCallback, useEffect, useRef, useState } from "react";
import { createGist, pullGist, pushGist, GistSyncError } from "../sync/gistSync";
import type { UseConference } from "./useConference";

const TOKEN_STORAGE_KEY = "conference-tracker:sync-token";
const AUTO_SYNC_INTERVAL_MS = 30 * 1000;

function loadToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export type SyncOutcome = "pulled" | "pushed" | "no-op" | "not-configured";

export function useGistSync(conf: UseConference) {
  const [token, setTokenState] = useState<string>(loadToken);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>(undefined);
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const conferenceRef = useRef(conf);
  useEffect(() => {
    conferenceRef.current = conf;
  });

  const gistId = conf.active?.gistId;

  const saveToken = useCallback((t: string) => {
    setTokenState(t);
    try {
      if (t) localStorage.setItem(TOKEN_STORAGE_KEY, t);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // localStorage unavailable — token still works for this session.
    }
  }, []);

  const syncNow = useCallback(async (): Promise<SyncOutcome> => {
    const active = conferenceRef.current.active;
    if (!token || !active?.gistId) return "not-configured";
    setSyncing(true);
    setLastError(undefined);
    try {
      const remote = await pullGist(token, active.gistId);
      let outcome: SyncOutcome;
      if (remote && remote.updatedAt > active.updatedAt) {
        conferenceRef.current.replaceActiveData({
          name: remote.name,
          companies: remote.companies,
          suggestedAdds: remote.suggestedAdds ?? [],
        });
        outcome = "pulled";
      } else {
        await pushGist(token, active.gistId, active);
        outcome = "pushed";
      }
      setLastSyncedAt(Date.now());
      return outcome;
    } catch (err) {
      setLastError(err instanceof GistSyncError ? err.message : "Sync failed — check your connection.");
      return "not-configured";
    } finally {
      setSyncing(false);
    }
  }, [token]);

  const linkNewGist = useCallback(async () => {
    const active = conferenceRef.current.active;
    if (!token || !active) return;
    setSyncing(true);
    setLastError(undefined);
    try {
      const id = await createGist(token, active);
      conferenceRef.current.setGistId(id);
      setLastSyncedAt(Date.now());
    } catch (err) {
      setLastError(err instanceof GistSyncError ? err.message : "Couldn't create the sync gist.");
    } finally {
      setSyncing(false);
    }
  }, [token]);

  const linkExistingGist = useCallback(
    (id: string) => {
      conferenceRef.current.setGistId(id.trim());
    },
    [],
  );

  const unlink = useCallback(() => {
    conferenceRef.current.setGistId(undefined);
    setLastError(undefined);
    setLastSyncedAt(undefined);
  }, []);

  // Auto-sync: once on link/app-open, then periodically while configured, and
  // again whenever the tab comes back to the foreground (e.g. switching back
  // from another app on the phone) for snappier cross-device convergence.
  useEffect(() => {
    if (!token || !gistId) return;
    void syncNow();
    const interval = setInterval(() => void syncNow(), AUTO_SYNC_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncNow();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, gistId, syncNow]);

  return {
    token,
    saveToken,
    gistId,
    syncing,
    lastSyncedAt,
    lastError,
    syncNow,
    linkNewGist,
    linkExistingGist,
    unlink,
  };
}

export type UseGistSync = ReturnType<typeof useGistSync>;
