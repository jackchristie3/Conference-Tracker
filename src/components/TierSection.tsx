import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import type { Company, Tier } from "../types";
import { tierContainerId } from "../utils/tierIds";
import { CompanyCard } from "./CompanyCard";

interface Props {
  tier: Tier;
  title: string;
  description: string;
  companies: Company[];
  onToggleStatus: (id: string, key: keyof Company["status"]) => void;
  onEdit: (company: Company) => void;
  /** Disable drag — used when the list is a filtered subset (search), since reordering/moving a subset would corrupt full-tier ranks. */
  draggable?: boolean;
  emptyState?: ReactNode;
}

/**
 * Presentational tier list. Sorting/cross-tier drag is coordinated by a
 * single DndContext shared across both tiers (see TieredBoard) so a card can
 * be dragged from one tier straight into the other, not just reordered
 * within its own list.
 */
export function TierSection({
  tier,
  title,
  description,
  companies,
  onToggleStatus,
  onEdit,
  draggable = true,
  emptyState,
}: Props) {
  const sorted = [...companies].sort((a, b) => a.rank - b.rank);
  const { setNodeRef, isOver } = useDroppable({ id: tierContainerId(tier), disabled: !draggable });

  const cards = sorted.map((company) => (
    <CompanyCard
      key={company.id}
      company={company}
      onToggleStatus={(key) => onToggleStatus(company.id, key)}
      onEdit={() => onEdit(company)}
      draggable={draggable}
    />
  ));

  return (
    <section>
      <div className="mb-2 px-1">
        <h2 className="text-lg font-bold text-slate-100">
          {title} <span className="text-sm font-normal text-slate-400">({sorted.length})</span>
        </h2>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[4rem] rounded-xl transition-colors ${
          isOver ? "bg-emerald-500/10 ring-2 ring-emerald-500/40" : ""
        }`}
      >
        {sorted.length === 0 ? (
          emptyState ?? (
            <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
              Drag a company here, or nothing here yet.
            </p>
          )
        ) : draggable ? (
          <SortableContext items={sorted.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">{cards}</div>
          </SortableContext>
        ) : (
          <div className="flex flex-col gap-2">{cards}</div>
        )}
      </div>
    </section>
  );
}
