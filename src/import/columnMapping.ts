export type FieldKey =
  | "name"
  | "booth"
  | "industry"
  | "notes"
  | "priority"
  | "interested"
  | "jobPosting"
  | "jobsCount"
  | "applyUrl"
  | "newsHeadline"
  | "newsUrl";

const CANDIDATES: Record<FieldKey, string[]> = {
  name: ["company", "company name", "exhibitor", "exhibitor name", "organization", "name"],
  booth: ["booth", "booth number", "booth #", "table", "table number", "location"],
  industry: ["industry", "sector", "vertical", "category"],
  notes: ["notes", "note", "comment", "comments", "sector fit", "why", "fit note"],
  priority: ["priority", "priority flag", "is priority", "top choice", "tier"],
  interested: ["interested", "interest", "target", "is target", "want"],
  jobPosting: ["internship", "posting", "job posting", "has posting", "internship posting"],
  jobsCount: ["jobs", "jobs on board", "job count", "open roles", "openings", "# jobs"],
  applyUrl: [
    "apply",
    "apply url",
    "apply link",
    "application link",
    "talent community",
    "talent network",
    "careers link",
  ],
  newsHeadline: ["news", "news headline", "headline", "article"],
  newsUrl: ["news url", "news link", "article url", "article link"],
};

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

/** Guess a column mapping from header names using keyword matching. Never throws. */
export function guessColumnMapping(headers: string[]): Partial<Record<FieldKey, string>> {
  const mapping: Partial<Record<FieldKey, string>> = {};
  const normalizedHeaders = headers.map((h) => ({ raw: h, norm: normalize(h) }));

  (Object.keys(CANDIDATES) as FieldKey[]).forEach((field) => {
    const candidates = CANDIDATES[field];
    // Exact match first, then substring match.
    let match = normalizedHeaders.find((h) => candidates.includes(h.norm));
    if (!match) {
      match = normalizedHeaders.find((h) => candidates.some((c) => h.norm.includes(c)));
    }
    if (match) mapping[field] = match.raw;
  });

  return mapping;
}

/** Normalize a company name for cross-list matching (case/punctuation/suffix insensitive). */
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(
      /\b(inc|incorporated|llc|l l c|co|corp|corporation|ltd|limited|company|group|holdings|the)\b/g,
      "",
    )
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

/** Fuzzy match ratio in [0, 1], 1 = identical after normalization. */
export function nameSimilarity(a: string, b: string): number {
  const na = normalizeCompanyName(a);
  const nb = normalizeCompanyName(b);
  if (na === nb) return 1;
  if (na.length === 0 || nb.length === 0) return 0;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return 1 - dist / maxLen;
}

export function parseBoolean(value: string): boolean {
  const v = value.trim().toLowerCase();
  return ["true", "yes", "y", "1", "x", "priority"].includes(v);
}

/**
 * For "interested" specifically: an unmapped or blank cell should mean "no
 * info, assume yes" rather than silently dropping the row, so this only
 * treats an explicit negative as not-interested.
 */
export function parseInterested(value: string): boolean {
  const v = value.trim().toLowerCase();
  return !["no", "n", "false", "0"].includes(v);
}

export function parseNumber(value: string): number {
  const n = parseInt(value.replace(/[^0-9-]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

/** True if most non-empty values in a column look like bare numbers, not names. */
export function columnLooksNumeric(values: string[]): boolean {
  const nonEmpty = values.map((v) => v.trim()).filter((v) => v.length > 0);
  if (nonEmpty.length === 0) return false;
  const numeric = nonEmpty.filter((v) => /^-?\d+(\.\d+)?$/.test(v));
  return numeric.length / nonEmpty.length >= 0.8;
}
