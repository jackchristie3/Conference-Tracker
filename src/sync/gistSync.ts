import type { Conference } from "../types";

const GIST_FILENAME = "conference-tracker-backup.json";
const API_BASE = "https://api.github.com";

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export class GistSyncError extends Error {}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

/** Creates a new private gist holding the conference JSON, returns its id. */
export async function createGist(token: string, conference: Conference): Promise<string> {
  const res = await fetch(`${API_BASE}/gists`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      description: `Conference Tracker backup — ${conference.name}`,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(conference, null, 2) } },
    }),
  });
  if (!res.ok) {
    throw new GistSyncError(`Couldn't create sync gist: ${await parseErrorBody(res)}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Fetches the conference JSON from a gist. Returns null if the file isn't there yet. */
export async function pullGist(token: string, gistId: string): Promise<Conference | null> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    headers: headers(token),
  });
  if (res.status === 404) {
    throw new GistSyncError("That gist wasn't found — check the id, or it may have been deleted.");
  }
  if (!res.ok) {
    throw new GistSyncError(`Couldn't reach sync gist: ${await parseErrorBody(res)}`);
  }
  const data = (await res.json()) as { files: Record<string, { content?: string } | undefined> };
  const file = data.files[GIST_FILENAME];
  if (!file?.content) return null;
  try {
    return JSON.parse(file.content) as Conference;
  } catch {
    throw new GistSyncError("The synced data doesn't look like valid JSON.");
  }
}

/** Overwrites the gist's conference JSON with the current local state. */
export async function pushGist(token: string, gistId: string, conference: Conference): Promise<void> {
  const res = await fetch(`${API_BASE}/gists/${gistId}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(conference, null, 2) } },
    }),
  });
  if (!res.ok) {
    throw new GistSyncError(`Couldn't push to sync gist: ${await parseErrorBody(res)}`);
  }
}

/** Confirms a token is valid by hitting an authenticated, low-cost endpoint. */
export async function verifyToken(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/user`, { headers: headers(token) });
  return res.ok;
}
