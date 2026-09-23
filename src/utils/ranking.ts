import type { Company } from "../types";

/**
 * Pre-sort heuristic for first import, fully overridable afterward by drag-and-drop.
 * Order of precedence: sector fit note present > explicit priority flag >
 * confirmed internship/job posting > jobs-on-board count.
 *
 * This scores whether a sector-fit note exists, not what it says — it's a
 * bootstrap ordering, not a judgment of actual fit. Don't read a high initial
 * rank as the app having evaluated the company; it's only reacting to the
 * presence of imported data.
 */
export function heuristicScore(company: Pick<
  Company,
  "sectorFitNote" | "priorityFlag" | "hasInternshipPosting" | "jobsOnBoardCount"
>): number {
  let score = 0;
  if (company.sectorFitNote.trim().length > 0) score += 1000;
  if (company.priorityFlag) score += 500;
  if (company.hasInternshipPosting) score += 250;
  score += Math.min(company.jobsOnBoardCount, 50) * 2;
  return score;
}

export function applyHeuristicRanks(companies: Company[]): Company[] {
  const byTier = new Map<string, Company[]>();
  for (const c of companies) {
    const list = byTier.get(c.tier) ?? [];
    list.push(c);
    byTier.set(c.tier, list);
  }
  const result: Company[] = [];
  for (const list of byTier.values()) {
    const sorted = [...list].sort((a, b) => heuristicScore(b) - heuristicScore(a));
    sorted.forEach((c, i) => result.push({ ...c, rank: i }));
  }
  return result;
}
