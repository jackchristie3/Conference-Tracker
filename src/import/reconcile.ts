import type { ParsedRow } from "./fileParser";
import {
  nameSimilarity,
  parseBoolean,
  parseInterested,
  parseNumber,
  type FieldKey,
} from "./columnMapping";
import { newCompany, type Company, type CompanyLink } from "../types";

const FUZZY_MATCH_THRESHOLD = 0.82;

export interface ExhibitorRecord {
  name: string;
  booth: string;
}

export interface TargetRecord {
  name: string;
  industry: string;
  notes: string;
  priorityFlag: boolean;
  interested: boolean;
  hasInternshipPosting: boolean;
  jobsOnBoardCount: number;
  applyUrl: string;
  news?: CompanyLink;
  preBoothNotes: string;
  postBoothNotes: string;
}

export function rowsToExhibitors(
  rows: ParsedRow[],
  mapping: Partial<Record<FieldKey, string>>,
): ExhibitorRecord[] {
  const nameCol = mapping.name;
  if (!nameCol) return [];
  return rows
    .map((r) => ({
      name: (r[nameCol] ?? "").trim(),
      booth: mapping.booth ? (r[mapping.booth] ?? "").trim() : "",
    }))
    .filter((r) => r.name.length > 0);
}

export function rowsToTargets(
  rows: ParsedRow[],
  mapping: Partial<Record<FieldKey, string>>,
): TargetRecord[] {
  const nameCol = mapping.name;
  if (!nameCol) return [];
  return rows
    .map((r) => {
      const headline = mapping.newsHeadline ? (r[mapping.newsHeadline] ?? "").trim() : "";
      const newsUrl = mapping.newsUrl ? (r[mapping.newsUrl] ?? "").trim() : "";
      return {
        name: (r[nameCol] ?? "").trim(),
        industry: mapping.industry ? (r[mapping.industry] ?? "").trim() : "",
        notes: mapping.notes ? (r[mapping.notes] ?? "").trim() : "",
        priorityFlag: mapping.priority ? parseBoolean(r[mapping.priority] ?? "") : false,
        interested: mapping.interested ? parseInterested(r[mapping.interested] ?? "") : true,
        hasInternshipPosting: mapping.jobPosting
          ? parseBoolean(r[mapping.jobPosting] ?? "")
          : false,
        jobsOnBoardCount: mapping.jobsCount ? parseNumber(r[mapping.jobsCount] ?? "") : 0,
        applyUrl: mapping.applyUrl ? (r[mapping.applyUrl] ?? "").trim() : "",
        news: headline || newsUrl ? { headline, url: newsUrl } : undefined,
        preBoothNotes: mapping.preBoothNotes ? (r[mapping.preBoothNotes] ?? "").trim() : "",
        postBoothNotes: mapping.postBoothNotes ? (r[mapping.postBoothNotes] ?? "").trim() : "",
      };
    })
    .filter((r) => r.name.length > 0);
}

export interface ReconcileResult {
  companies: Company[];
  unmatchedExhibitors: ExhibitorRecord[];
  skippedNotInterested: number;
}

/**
 * Cross-reference the user's target list against the official exhibitor list.
 * Target companies not found on the exhibitor list are flagged (no confirmed booth).
 * Exhibitors not on the target list are returned separately as suggested-add candidates.
 * Targets explicitly marked not-interested are dropped rather than imported.
 */
export function reconcile(
  exhibitors: ExhibitorRecord[],
  targets: TargetRecord[],
): ReconcileResult {
  const matchedExhibitorIndexes = new Set<number>();
  const interestedTargets = targets.filter((t) => t.interested);
  const skippedNotInterested = targets.length - interestedTargets.length;

  const companies: Company[] = interestedTargets.map((target) => {
    let bestIndex = -1;
    let bestScore = 0;
    exhibitors.forEach((ex, i) => {
      if (matchedExhibitorIndexes.has(i)) return;
      const score = nameSimilarity(target.name, ex.name);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    });

    const matched = bestIndex >= 0 && bestScore >= FUZZY_MATCH_THRESHOLD;
    if (matched) matchedExhibitorIndexes.add(bestIndex);
    const booth = matched ? exhibitors[bestIndex].booth : "";

    return newCompany({
      name: target.name,
      booth,
      flaggedNoBooth: !matched,
      industry: target.industry,
      sectorFitNote: target.notes,
      priorityFlag: target.priorityFlag,
      hasInternshipPosting: target.hasInternshipPosting,
      jobsOnBoardCount: target.jobsOnBoardCount,
      applyUrl: target.applyUrl,
      news: target.news,
      preBoothNotes: target.preBoothNotes,
      postBoothNotes: target.postBoothNotes,
      tier: target.priorityFlag ? "priority" : "quick-apply",
    });
  });

  const unmatchedExhibitors = exhibitors.filter((_, i) => !matchedExhibitorIndexes.has(i));

  return { companies, unmatchedExhibitors, skippedNotInterested };
}
