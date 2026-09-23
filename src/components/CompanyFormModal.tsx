import { useState } from "react";
import type { Company, Tier } from "../types";

export interface CompanyFormValue {
  name: string;
  booth: string;
  tier: Tier;
  industry: string;
  sectorFitNote: string;
  applyUrl: string;
  newsHeadline: string;
  newsUrl: string;
  notes: string;
  priorityFlag: boolean;
  flaggedNoBooth: boolean;
}

interface Props {
  initial?: Company;
  defaultTier?: Tier;
  onSave: (value: CompanyFormValue) => void;
  onClose: () => void;
  onRemove?: () => void;
  onMoveTier?: () => void;
}

function toFormValue(c?: Company, defaultTier: Tier = "quick-apply"): CompanyFormValue {
  return {
    name: c?.name ?? "",
    booth: c?.booth ?? "",
    tier: c?.tier ?? defaultTier,
    industry: c?.industry ?? "",
    sectorFitNote: c?.sectorFitNote ?? "",
    applyUrl: c?.applyUrl ?? "",
    newsHeadline: c?.news?.headline ?? "",
    newsUrl: c?.news?.url ?? "",
    notes: c?.notes ?? "",
    priorityFlag: c?.priorityFlag ?? false,
    flaggedNoBooth: c?.flaggedNoBooth ?? !c?.booth,
  };
}

export function CompanyFormModal({
  initial,
  defaultTier,
  onSave,
  onClose,
  onRemove,
  onMoveTier,
}: Props) {
  const [value, setValue] = useState<CompanyFormValue>(toFormValue(initial, defaultTier));

  const set = <K extends keyof CompanyFormValue>(key: K, v: CompanyFormValue[K]) =>
    setValue((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-slate-900 p-4 shadow-xl sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">
            {initial ? "Edit company" : "Add company"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!value.name.trim()) return;
            onSave(value);
          }}
        >
          <Field label="Company name">
            <input
              className="input"
              value={value.name}
              onChange={(e) => set("name", e.target.value)}
              required
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Booth #">
              <input
                className="input"
                value={value.booth}
                onChange={(e) => {
                  const booth = e.target.value;
                  setValue((prev) => ({ ...prev, booth, flaggedNoBooth: !booth.trim() }));
                }}
                placeholder="e.g. 214"
              />
            </Field>
            <Field label="Tier">
              <select
                className="input"
                value={value.tier}
                onChange={(e) => set("tier", e.target.value as Tier)}
              >
                <option value="priority">Priority (deep focus)</option>
                <option value="quick-apply">Quick apply</option>
              </select>
            </Field>
          </div>

          <label className="flex min-h-[36px] items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={value.flaggedNoBooth}
              onChange={(e) => set("flaggedNoBooth", e.target.checked)}
            />
            No confirmed booth (not on official exhibitor list)
          </label>

          <Field label="Industry / sector">
            <input
              className="input"
              value={value.industry}
              onChange={(e) => set("industry", e.target.value)}
            />
          </Field>

          <Field label="Why this company matters (sector fit)">
            <textarea
              className="input"
              rows={2}
              value={value.sectorFitNote}
              onChange={(e) => set("sectorFitNote", e.target.value)}
            />
          </Field>

          <Field label="Application / talent-pipeline link">
            <input
              className="input"
              type="url"
              placeholder="https://"
              value={value.applyUrl}
              onChange={(e) => set("applyUrl", e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="News headline">
              <input
                className="input"
                value={value.newsHeadline}
                onChange={(e) => set("newsHeadline", e.target.value)}
              />
            </Field>
            <Field label="News link">
              <input
                className="input"
                type="url"
                placeholder="https://"
                value={value.newsUrl}
                onChange={(e) => set("newsUrl", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              className="input"
              rows={2}
              value={value.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>

          <label className="flex min-h-[36px] items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={value.priorityFlag}
              onChange={(e) => set("priorityFlag", e.target.checked)}
            />
            Priority flag
          </label>

          {initial && (onMoveTier || onRemove) && (
            <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
              {onMoveTier && (
                <button
                  type="button"
                  onClick={onMoveTier}
                  className="min-h-[40px] flex-1 rounded-xl bg-slate-800 text-sm font-medium text-slate-200"
                >
                  Move to {initial.tier === "priority" ? "Quick Apply" : "Priority"}
                </button>
              )}
              {onRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className="min-h-[40px] flex-1 rounded-xl bg-red-900/50 text-sm text-red-300"
                >
                  Remove company
                </button>
              )}
            </div>
          )}

          <div className="sticky bottom-0 flex gap-2 bg-slate-900 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] flex-1 rounded-xl bg-slate-800 font-medium text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] flex-1 rounded-xl bg-emerald-600 font-semibold text-white"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
