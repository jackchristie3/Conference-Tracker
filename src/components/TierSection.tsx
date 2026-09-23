import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import type { Company } from "../types";
import { CompanyCard } from "./CompanyCard";

interface Props {
  title: string;
  description: string;
  companies: Company[];
  onReorder: (orderedIds: string[]) => void;
  onToggleStatus: (id: string, key: keyof Company["status"]) => void;
  onEdit: (company: Company) => void;
  /** Disable drag-to-reorder — used when the list is a filtered subset (search), since reordering a subset would corrupt full-tier ranks. */
  draggable?: boolean;
  emptyState?: ReactNode;
}

export function TierSection({
  title,
  description,
  companies,
  onReorder,
  onToggleStatus,
  onEdit,
  draggable = true,
  emptyState,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = [...companies].sort((a, b) => a.rank - b.rank);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sorted.map((c) => c.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...ids];
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, String(active.id));
    onReorder(next);
  }

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
      {sorted.length === 0 ? (
        emptyState ?? (
          <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
            Nothing here yet.
          </p>
        )
      ) : draggable ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">{cards}</div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex flex-col gap-2">{cards}</div>
      )}
    </section>
  );
}
