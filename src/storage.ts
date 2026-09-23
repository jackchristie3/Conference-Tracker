import { get, set, keys, del } from "idb-keyval";
import type { Conference } from "./types";

const CONFERENCE_PREFIX = "conference:";
const ACTIVE_CONFERENCE_KEY = "active-conference-id";

const key = (id: string) => `${CONFERENCE_PREFIX}${id}`;

export async function loadAllConferences(): Promise<Conference[]> {
  const allKeys = await keys();
  const confKeys = allKeys.filter(
    (k): k is string => typeof k === "string" && k.startsWith(CONFERENCE_PREFIX),
  );
  const conferences = await Promise.all(confKeys.map((k) => get<Conference>(k)));
  return conferences
    .filter((c): c is Conference => Boolean(c))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function saveConference(conference: Conference): Promise<void> {
  await set(key(conference.id), conference);
}

export async function deleteConference(id: string): Promise<void> {
  await del(key(id));
}

export async function getActiveConferenceId(): Promise<string | undefined> {
  return get<string>(ACTIVE_CONFERENCE_KEY);
}

export async function setActiveConferenceId(id: string): Promise<void> {
  await set(ACTIVE_CONFERENCE_KEY, id);
}
