import type { Id } from "@convex/_generated/dataModel";

export type KanbanColumn = { _id: Id<"columns">; name: string };
export type KanbanCard = {
  _id: Id<"cards">;
  title: string;
  columnId: Id<"columns">;
  dependsOnCardId?: Id<"cards">;
  dependsOnColumnId?: Id<"columns">;
  deletedAt?: number;
};

/** Why this card cannot be dragged, or null if it can. */
export function getCardDragBlockReason(
  card: KanbanCard,
  columns: KanbanColumn[],
  cardsById: Map<string, KanbanCard>,
): string | null {
  if (!card.dependsOnCardId || !card.dependsOnColumnId) {
    return null;
  }

  const dependency = cardsById.get(card.dependsOnCardId);
  if (!dependency || dependency.deletedAt) {
    return null;
  }

  if (dependency.columnId === card.dependsOnColumnId) {
    return null;
  }

  const requiredColumn = columns.find((c) => c._id === card.dependsOnColumnId);
  const columnName = requiredColumn?.name ?? "the required column";

  return `Blocked: "${dependency.title}" must be in ${columnName} before you can move this task.`;
}

export function buildCardsById(cards: KanbanCard[]): Map<string, KanbanCard> {
  return new Map(cards.map((c) => [c._id, c]));
}
