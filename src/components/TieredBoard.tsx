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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import type { Company, Tier } from "../types";
import { tierContainerId } from "../utils/tierIds";
import { TierSection } from "./TierSection";

interface Props {
  companies: Company[];
  activeTab: "priority" | "quick-apply";
  draggable: boolean;
  onToggleStatus: (id: string, key: keyof Company["status"]) => void;
  onEdit: (company: Company) => void;
  onReorderTier: (tier: Tier, orderedIds: string[]) => void;
  onMoveToPosition: (id: string, tier: Tier, index: number) => void;
  emptyState?: ReactNode;
}

const byTier = (companies: Company[], tier: Tier) =>
  companies.filter((c) => c.tier === tier).sort((a, b) => a.rank - b.rank);

/**
 * Both tier lists share a single DndContext so a card can be dragged straight
 * from Quick Apply into Priority (or back), not just reordered within its own
 * tier. Same-tier drops reorder in place; cross-tier drops insert the card at
 * the dropped position in the destination tier.
 */
export function TieredBoard({
  companies,
  activeTab,
  draggable,
  onToggleStatus,
  onEdit,
  onReorderTier,
  onMoveToPosition,
  emptyState,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeCompany = companies.find((c) => c.id === activeId);
    if (!activeCompany) return;

    const overIsContainer = overId === tierContainerId("priority") || overId === tierContainerId("quick-apply");
    const overCompany = overIsContainer ? undefined : companies.find((c) => c.id === overId);
    if (!overIsContainer && !overCompany) return;

    const destTier: Tier = overIsContainer
      ? (overId === tierContainerId("priority") ? "priority" : "quick-apply")
      : overCompany!.tier;

    if (destTier === activeCompany.tier) {
      const ids = byTier(companies, destTier).map((c) => c.id);
      const oldIndex = ids.indexOf(activeId);
      const newIndex = overIsContainer ? ids.length - 1 : ids.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const next = [...ids];
      next.splice(oldIndex, 1);
      next.splice(newIndex, 0, activeId);
      onReorderTier(destTier, next);
    } else {
      const destIds = byTier(companies, destTier).map((c) => c.id);
      const destIndex = overIsContainer ? destIds.length : destIds.indexOf(overId);
      onMoveToPosition(activeId, destTier, destIndex === -1 ? destIds.length : destIndex);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        <div className={activeTab === "priority" ? "block" : "hidden lg:block"}>
          <TierSection
            tier="priority"
            title="Priority — deep focus"
            description="Researched and ranked. Drag to reorder, or drag a card in from Quick apply."
            companies={byTier(companies, "priority")}
            onToggleStatus={onToggleStatus}
            onEdit={onEdit}
            draggable={draggable}
            emptyState={emptyState}
          />
        </div>
        <div className={activeTab === "quick-apply" ? "block" : "hidden lg:block"}>
          <TierSection
            tier="quick-apply"
            title="Quick apply"
            description="Grab the link, apply, move on."
            companies={byTier(companies, "quick-apply")}
            onToggleStatus={onToggleStatus}
            onEdit={onEdit}
            draggable={draggable}
            emptyState={emptyState}
          />
        </div>
      </div>
    </DndContext>
  );
}
