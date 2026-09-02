import { z } from "zod";

/**
 * The list envelope every collection endpoint returns. Shape matches the
 * `{ query, page, pageSize: 10 }` state all four admin list pages already
 * keep client-side, so wiring them up is a swap, not a rewrite.
 */
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().trim().max(200).optional(),
});

export type PageQuery = z.infer<typeof pageQuery>;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const paged = <T>(items: T[], total: number, p: PageQuery): Page<T> => ({
  items,
  total,
  page: p.page,
  pageSize: p.pageSize,
});

export const offsetOf = (p: PageQuery) => (p.page - 1) * p.pageSize;
