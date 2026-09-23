import { get, set, keys, del } from "idb-keyval";
import type { Conference } from "./types";

const CONFERENCE_PREFIX = "conference:";
const ACTIVE_CONFERENCE_KEY = "active-conference-id";

const key = (id: string) => `${CONFERENCE_PREFIX}${id}`;

/**
 * Data written before the pre/post-booth notes split only has a single
 * `notes` field. Map it onto `preBoothNotes` on load rather than dropping it
 * — anything already there was written pre-conference, under the old model.
 */
function migrateConference(conference: Conference): Conference {
  return {
    ...conference,
    companies: conference.companies.map((c) => {
      const legacyNotes = (c as unknown as { notes?: string }).notes;
      if (c.preBoothNotes !== undefined || !legacyNotes) return c;
      const { notes: _notes, ...rest } = c as unknown as { notes?: string } & typeof c;
      return { ...rest, preBoothNotes: legacyNotes, postBoothNotes: c.postBoothNotes ?? "" };
    }),
  };
}

export async function loadAllConferences(): Promise<Conference[]> {
  const allKeys = await keys();
  const confKeys = allKeys.filter(
    (k): k is string => typeof k === "string" && k.startsWith(CONFERENCE_PREFIX),
  );
  const conferences = await Promise.all(confKeys.map((k) => get<Conference>(k)));
  return conferences
    .filter((c): c is Conference => Boolean(c))
    .map(migrateConference)
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
