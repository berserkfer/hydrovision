/**
 * Registro de soft-delete en modo mock — Sprint 3E
 */

const deletedIds = new Map<string, Set<string>>();

function bucket(entity: string): Set<string> {
  if (!deletedIds.has(entity)) deletedIds.set(entity, new Set());
  return deletedIds.get(entity)!;
}

export function markSoftDeleted(entity: string, id: string): void {
  bucket(entity).add(id);
}

export function isSoftDeleted(entity: string, id: string): boolean {
  return bucket(entity).has(id);
}

export function filterActive<T extends { id: string }>(entity: string, items: T[]): T[] {
  const deleted = bucket(entity);
  return items.filter((item) => !deleted.has(item.id));
}

export function restoreSoftDeleted(entity: string, id: string): void {
  bucket(entity).delete(id);
}
