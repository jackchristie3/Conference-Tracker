export type Tier = "priority" | "quick-apply";

export interface CompanyLink {
  headline: string;
  url: string;
}

export interface CompanyStatus {
  applied: boolean;
  newsRead: boolean;
  talkedAtBooth: boolean;
}

export interface Company {
  id: string;
  name: string;
  booth: string;
  tier: Tier;
  rank: number;
  industry: string;
  sectorFitNote: string;
  news?: CompanyLink;
  applyUrl: string;
  secondaryLinks: CompanyLink[];
  status: CompanyStatus;
  flaggedNoBooth: boolean;
  /** Talking points / prep, read right before walking up to the booth. */
  preBoothNotes: string;
  /** What actually happened — who you talked to, what was discussed, next steps. */
  postBoothNotes: string;
  priorityFlag: boolean;
  hasInternshipPosting: boolean;
  jobsOnBoardCount: number;
  suggestedAdd?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SuggestedAdd {
  name: string;
  booth: string;
}

export interface Conference {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  companies: Company[];
  suggestedAdds?: SuggestedAdd[];
  /** Private GitHub Gist id used for cross-device sync, if linked. */
  gistId?: string;
}

export const emptyStatus = (): CompanyStatus => ({
  applied: false,
  newsRead: false,
  talkedAtBooth: false,
});

export const newCompany = (partial: Partial<Company> & { name: string }): Company => {
  const now = Date.now();
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c_${now}_${Math.random().toString(36).slice(2, 9)}`,
    name: partial.name,
    booth: partial.booth ?? "",
    tier: partial.tier ?? "quick-apply",
    rank: partial.rank ?? 0,
    industry: partial.industry ?? "",
    sectorFitNote: partial.sectorFitNote ?? "",
    news: partial.news,
    applyUrl: partial.applyUrl ?? "",
    secondaryLinks: partial.secondaryLinks ?? [],
    status: partial.status ?? emptyStatus(),
    flaggedNoBooth: partial.flaggedNoBooth ?? false,
    preBoothNotes: partial.preBoothNotes ?? "",
    postBoothNotes: partial.postBoothNotes ?? "",
    priorityFlag: partial.priorityFlag ?? false,
    hasInternshipPosting: partial.hasInternshipPosting ?? false,
    jobsOnBoardCount: partial.jobsOnBoardCount ?? 0,
    suggestedAdd: partial.suggestedAdd ?? false,
    createdAt: partial.createdAt ?? now,
    updatedAt: now,
  };
};
