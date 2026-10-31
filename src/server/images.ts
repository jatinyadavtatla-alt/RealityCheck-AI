import "server-only";
import type { ImageRow } from "@/db/schema";
import type { ImageMeta } from "@/lib/types";

/**
 * Deterministic reference assignment shared by the analysis pipeline and the
 * report UI: product photos become P1..Pn, listing screenshots L1..Ln,
 * ordered by creation time then id.
 */
export function assignImageRefs(
  rows: Pick<ImageRow, "id" | "kind" | "createdAt">[]
): Map<string, string> {
  const byTime = (
    a: Pick<ImageRow, "id" | "createdAt">,
    b: Pick<ImageRow, "id" | "createdAt">
  ) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id);

  const map = new Map<string, string>();
  rows
    .filter((r) => r.kind === "product")
    .sort(byTime)
    .forEach((r, i) => map.set(r.id, `P${i + 1}`));
  rows
    .filter((r) => r.kind !== "product")
    .sort(byTime)
    .forEach((r, i) => map.set(r.id, `L${i + 1}`));
  return map;
}

export function toImageMeta(
  row: Pick<ImageRow, "id" | "kind" | "fileName" | "mimeType" | "sizeBytes">,
  ref?: string
): ImageMeta {
  return {
    id: row.id,
    kind: row.kind === "listing" ? "listing" : "product",
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    url: `/api/images/${row.id}`,
    ref,
  };
}
