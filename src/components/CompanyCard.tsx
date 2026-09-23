import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Company } from "../types";

interface Props {
  company: Company;
  onToggleStatus: (key: keyof Company["status"]) => void;
  onEdit: () => void;
  draggable?: boolean;
}

const statusMeta: { key: keyof Company["status"]; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "newsRead", label: "News read" },
  { key: "talkedAtBooth", label: "Talked at booth" },
];

export function CompanyCard({ company, onToggleStatus, onEdit, draggable = true }: Props) {
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
        {draggable && (
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
        )}

        <button
          type="button"
          onClick={onEdit}
          aria-label={`View and edit details for ${company.name}`}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-base font-semibold text-slate-100">{company.name}</span>
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
          {company.sectorFitNote && (
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-400">{company.sectorFitNote}</p>
          )}
          {company.preBoothNotes && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-300">
              <span className="text-slate-500">Talking points: </span>
              {company.preBoothNotes}
            </p>
          )}
        </button>

        <div className="flex shrink-0 flex-col items-center gap-1">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700/60 text-xs font-semibold text-slate-300"
            aria-label={`${doneCount} of 3 steps done`}
          >
            {doneCount}/3
          </div>
          {company.postBoothNotes ? (
            <span
              className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400"
              title="Post-booth debrief added"
            >
              ✓ debrief
            </span>
          ) : (
            company.status.talkedAtBooth && (
              <span
                className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-400"
                title="Talked at booth but no debrief notes yet"
              >
                needs debrief
              </span>
            )
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 px-3 pb-2">
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

      <div className="flex flex-wrap items-center gap-3 px-3 pb-3 text-sm">
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
    </div>
  );
}
