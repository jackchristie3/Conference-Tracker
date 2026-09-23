import { useState } from "react";
import type { SuggestedAdd } from "../types";

interface Props {
  suggestions: SuggestedAdd[];
  onAdd: (suggestion: SuggestedAdd) => void;
  onDismiss: (name: string) => void;
}

export function SuggestedAddsPanel({ suggestions, onAdd, onDismiss }: Props) {
  const [filter, setFilter] = useState("");

  const filtered = suggestions.filter((s) =>
    s.name.toLowerCase().includes(filter.trim().toLowerCase()),
  );

  return (
    <section>
      <div className="mb-2 px-1">
        <h2 className="text-lg font-bold text-slate-100">
          Suggested adds{" "}
          <span className="text-sm font-normal text-slate-400">({suggestions.length})</span>
        </h2>
        <p className="text-sm text-slate-400">
          Exhibitors on the official list that aren't on your target list yet. Scan for anything
          matching your interests.
        </p>
      </div>
      {suggestions.length > 0 && (
        <input
          className="input mb-3"
          placeholder="Filter by name or keyword…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
          {suggestions.length === 0
            ? "Nothing here — import an exhibitor list to populate this."
            : "No matches."}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-800/60 p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-100">{s.name}</p>
                {s.booth && <p className="text-xs text-slate-400">Booth {s.booth}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onAdd(s)}
                  className="min-h-[36px] rounded-lg bg-emerald-600 px-3 text-sm font-medium text-white"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(s.name)}
                  className="min-h-[36px] rounded-lg bg-slate-700 px-3 text-sm text-slate-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
