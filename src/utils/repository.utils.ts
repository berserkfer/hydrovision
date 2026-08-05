/** Utilidades compartidas entre repositorios mock */

export function resolveNombre(
  id: string,
  collection: readonly { id: string; nombre: string }[]
): string {
  return collection.find((item) => item.id === id)?.nombre ?? "—";
}

export function countByFilter<T>(
  items: readonly T[],
  predicate: (item: T) => boolean
): number {
  return items.filter(predicate).length;
}
