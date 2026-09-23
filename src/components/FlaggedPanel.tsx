import type { Company } from "../types";

interface Props {
  companies: Company[];
  onEdit: (company: Company) => void;
}

export function FlaggedPanel({ companies, onEdit }: Props) {
  const flagged = companies
    .filter((c) => c.flaggedNoBooth)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <section>
      <div className="mb-2 px-1">
        <h2 className="text-lg font-bold text-slate-100">
          No confirmed booth{" "}
          <span className="text-sm font-normal text-slate-400">({flagged.length})</span>
        </h2>
        <p className="text-sm text-slate-400">
          On your target list but not matched to the official exhibitor list — could be a name
          mismatch, or they might not be exhibiting.
        </p>
      </div>
      {flagged.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
          Everything's matched.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {flagged.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onEdit(c)}
              className="flex items-center justify-between rounded-xl border border-amber-700/40 bg-amber-950/20 p-3 text-left"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-100">{c.name}</p>
                {c.industry && <p className="truncate text-xs text-slate-400">{c.industry}</p>}
              </div>
              <span className="shrink-0 text-xs font-medium text-amber-400">Edit →</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
