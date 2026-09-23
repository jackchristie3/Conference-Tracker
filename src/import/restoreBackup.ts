import type { Company, Conference, SuggestedAdd } from "../types";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function coerceCompany(x: unknown): Company | undefined {
  if (!isRecord(x) || typeof x.name !== "string" || typeof x.id !== "string") return undefined;
  const status = isRecord(x.status) ? x.status : {};
  return {
    id: x.id,
    name: x.name,
    booth: typeof x.booth === "string" ? x.booth : "",
    tier: x.tier === "priority" ? "priority" : "quick-apply",
    rank: typeof x.rank === "number" ? x.rank : 0,
    industry: typeof x.industry === "string" ? x.industry : "",
    sectorFitNote: typeof x.sectorFitNote === "string" ? x.sectorFitNote : "",
    news:
      isRecord(x.news) && typeof x.news.url === "string"
        ? { headline: typeof x.news.headline === "string" ? x.news.headline : "", url: x.news.url }
        : undefined,
    applyUrl: typeof x.applyUrl === "string" ? x.applyUrl : "",
    secondaryLinks: Array.isArray(x.secondaryLinks) ? x.secondaryLinks : [],
    status: {
      applied: Boolean(status.applied),
      newsRead: Boolean(status.newsRead),
      talkedAtBooth: Boolean(status.talkedAtBooth),
    },
    flaggedNoBooth: Boolean(x.flaggedNoBooth),
    preBoothNotes:
      typeof x.preBoothNotes === "string"
        ? x.preBoothNotes
        : typeof x.notes === "string"
          ? x.notes
          : "",
    postBoothNotes: typeof x.postBoothNotes === "string" ? x.postBoothNotes : "",
    priorityFlag: Boolean(x.priorityFlag),
    hasInternshipPosting: Boolean(x.hasInternshipPosting),
    jobsOnBoardCount: typeof x.jobsOnBoardCount === "number" ? x.jobsOnBoardCount : 0,
    suggestedAdd: Boolean(x.suggestedAdd),
    createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
    updatedAt: typeof x.updatedAt === "number" ? x.updatedAt : Date.now(),
  };
}

function coerceSuggestedAdd(x: unknown): SuggestedAdd | undefined {
  if (!isRecord(x) || typeof x.name !== "string") return undefined;
  return { name: x.name, booth: typeof x.booth === "string" ? x.booth : "" };
}

export interface ParsedBackup {
  name: string;
  companies: Company[];
  suggestedAdds: SuggestedAdd[];
  capturedAt?: number;
}

export function parseBackupJson(text: string): { backup?: ParsedBackup; error?: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: "That file isn't valid JSON." };
  }
  if (!isRecord(data) || !Array.isArray(data.companies)) {
    return { error: "That doesn't look like a Conference Tracker backup file." };
  }
  const companies = data.companies.map(coerceCompany).filter((c): c is Company => Boolean(c));
  if (companies.length === 0) {
    return { error: "No valid companies found in that backup." };
  }
  const suggestedAdds = Array.isArray(data.suggestedAdds)
    ? data.suggestedAdds.map(coerceSuggestedAdd).filter((s): s is SuggestedAdd => Boolean(s))
    : [];
  return {
    backup: {
      name: typeof data.name === "string" ? data.name : "Restored conference",
      companies,
      suggestedAdds,
      capturedAt: typeof data.updatedAt === "number" ? data.updatedAt : undefined,
    },
  };
}

export async function parseBackupFile(
  file: File,
): Promise<{ backup?: ParsedBackup; error?: string }> {
  try {
    const text = await file.text();
    return parseBackupJson(text);
  } catch {
    return { error: "Couldn't read that file." };
  }
}

export function conferenceFromBackup(backup: ParsedBackup): Pick<Conference, "name" | "companies" | "suggestedAdds"> {
  return { name: backup.name, companies: backup.companies, suggestedAdds: backup.suggestedAdds };
}
