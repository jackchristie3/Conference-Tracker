import type { Tier } from "../types";

/** dnd-kit droppable id for a tier's whole-column drop zone (empty area, or dropping past the last card). */
export const tierContainerId = (tier: Tier) => `tier-container:${tier}`;
