import { useState } from "react";
import type { UseGistSync } from "../hooks/useGistSync";

interface Props {
  sync: UseGistSync;
  onClose: () => void;
}

function timeAgo(ms: number): string {
  const seconds = Math.round((Date.now() - ms) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

export function SyncPanel({ sync, onClose }: Props) {
  const [tokenInput, setTokenInput] = useState(sync.token);
  const [gistIdInput, setGistIdInput] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-slate-900 p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Sync across devices</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!sync.token && (
          <div className="space-y-2">
            <p className="text-sm text-slate-400">
              Syncs this conference between devices using a private GitHub Gist as storage. Create
              a{" "}
              <a
                href="https://github.com/settings/tokens/new?scopes=gist&description=Conference%20Tracker%20sync"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline-offset-2 hover:underline"
              >
                personal access token
              </a>{" "}
              with just the <code className="text-slate-300">gist</code> scope, and paste it
              below. It's stored only in this browser's local storage, never sent anywhere but
              directly to GitHub's API.
            </p>
            <input
              type="password"
              className="input"
              placeholder="ghp_…"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <button
              type="button"
              disabled={!tokenInput.trim()}
              onClick={() => sync.saveToken(tokenInput.trim())}
              className="min-h-[44px] w-full rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-40"
            >
              Save token
            </button>
          </div>
        )}

        {sync.token && !sync.gistId && (
          <div className="space-y-4">
            <div className="space-y-2">
              <button
                type="button"
                disabled={sync.syncing}
                onClick={() => void sync.linkNewGist()}
                className="min-h-[44px] w-full rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-40"
              >
                {sync.syncing ? "Creating…" : "Create new sync gist"}
              </button>
              <p className="text-xs text-slate-500">
                Do this once, on your first device. On the second device, use "Link existing gist"
                below with the same id instead.
              </p>
            </div>
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <input
                className="input"
                placeholder="Existing gist id"
                value={gistIdInput}
                onChange={(e) => setGistIdInput(e.target.value)}
              />
              <button
                type="button"
                disabled={!gistIdInput.trim()}
                onClick={() => sync.linkExistingGist(gistIdInput.trim())}
                className="min-h-[44px] w-full rounded-xl bg-slate-800 font-medium text-slate-200 disabled:opacity-40"
              >
                Link existing gist
              </button>
            </div>
            <button
              type="button"
              onClick={() => sync.saveToken("")}
              className="text-xs text-slate-500 underline-offset-2 hover:underline"
            >
              Remove saved token
            </button>
          </div>
        )}

        {sync.token && sync.gistId && (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-800/60 p-3 text-sm text-slate-300">
              <p>
                Linked to gist{" "}
                <code className="text-slate-100">{sync.gistId.slice(0, 12)}…</code>
              </p>
              <p className="mt-1 text-slate-400">
                {sync.syncing
                  ? "Syncing…"
                  : sync.lastSyncedAt
                    ? `Last synced ${timeAgo(sync.lastSyncedAt)}`
                    : "Not yet synced"}
              </p>
              {sync.lastError && <p className="mt-1 text-red-400">{sync.lastError}</p>}
            </div>
            <button
              type="button"
              disabled={sync.syncing}
              onClick={() => void sync.syncNow()}
              className="min-h-[44px] w-full rounded-xl bg-emerald-600 font-semibold text-white disabled:opacity-40"
            >
              Sync now
            </button>
            <p className="text-xs text-slate-500">
              Auto-syncs about every 30s while this tab is open, and whenever you switch back to
              it. Whichever device saved most recently wins if both changed something.
            </p>
            <button
              type="button"
              onClick={sync.unlink}
              className="text-xs text-slate-500 underline-offset-2 hover:underline"
            >
              Unlink this conference from sync
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
