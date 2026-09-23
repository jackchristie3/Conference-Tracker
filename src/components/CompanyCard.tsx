import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Company } from "../types";

interface Props {
  company: Company;
  onToggleStatus: (key: keyof Company["status"]) => void;
  onEdit: () => void;
  onRemove: () => void;
  onMoveTier: () => void;
}

const statusMeta: { key: keyof Company["status"]; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "newsRead", label: "News read" },
  { key: "talkedAtBooth", label: "Talked at booth" },
];

export function CompanyCard({ company, onToggleStatus, onEdit, onRemove, onMoveTier }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: company.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const doneCount = statusMeta.filter((s) => company.status[s.key]).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-slate-700 bg-slate-800/60 shadow-sm ${
        isDragging ? "opacity-60 ring-2 ring-emerald-500" : ""
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          aria-label="Drag to reorder"
          className="mt-1 flex h-10 w-10 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg bg-slate-700/60 text-slate-300 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <circle cx="6" cy="5" r="1.5" />
            <circle cx="6" cy="10" r="1.5" />
            <circle cx="6" cy="15" r="1.5" />
            <circle cx="14" cy="5" r="1.5" />
            <circle cx="14" cy="10" r="1.5" />
            <circle cx="14" cy="15" r="1.5" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="truncate text-left text-base font-semibold text-slate-100"
            >
              {company.name}
            </button>
            {company.flaggedNoBooth ? (
              <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                No confirmed booth
              </span>
            ) : company.booth ? (
              <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-xs font-medium text-slate-300">
                Booth {company.booth}
              </span>
            ) : null}
            {company.priorityFlag && (
              <span className="shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Priority
              </span>
            )}
          </div>
          {company.industry && (
            <p className="mt-0.5 truncate text-sm text-slate-400">{company.industry}</p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {statusMeta.map(({ key, label }) => (
              <label
                key={key}
                className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-slate-200"
              >
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-slate-500 bg-slate-700"
                  checked={company.status[key]}
                  onChange={() => onToggleStatus(key)}
                />
                {label}
              </label>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            {company.applyUrl && (
              <a
                href={company.applyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[36px] items-center gap-1 font-medium text-emerald-400 underline-offset-2 hover:underline"
              >
                Apply / join pipeline ↗
              </a>
            )}
            {company.news?.url && (
              <a
                href={company.news.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[36px] items-center gap-1 text-sky-400 underline-offset-2 hover:underline"
              >
                News{company.news.headline ? `: ${company.news.headline}` : ""} ↗
              </a>
            )}
          </div>

          {expanded && (
            <div className="mt-3 space-y-2 border-t border-slate-700 pt-3 text-sm text-slate-300">
              {company.sectorFitNote && (
                <p>
                  <span className="font-medium text-slate-400">Sector fit: </span>
                  {company.sectorFitNote}
                </p>
              )}
              {company.notes && (
                <p>
                  <span className="font-medium text-slate-400">Notes: </span>
                  {company.notes}
                </p>
              )}
              {company.secondaryLinks.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {company.secondaryLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 underline-offset-2 hover:underline"
                    >
                      {link.headline || "Link"} ↗
                    </a>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={onEdit}
                  className="min-h-[36px] rounded-lg bg-slate-700 px-3 text-slate-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onMoveTier}
                  className="min-h-[36px] rounded-lg bg-slate-700 px-3 text-slate-100"
                >
                  Move to {company.tier === "priority" ? "Quick Apply" : "Priority"}
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="min-h-[36px] rounded-lg bg-red-900/50 px-3 text-red-300"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700/60 text-xs font-semibold text-slate-300">
          {doneCount}/3
        </div>
      </div>
    </div>
  );
}
