import type { RequestHandler } from "express";

export type PaginationResult = {
  page: number;
  pageSize: number;
  skip: number;
};

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function getPagination(query: Record<string, unknown>): PaginationResult {
  const page = Math.max(Number(query.page ?? 1) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize ?? 10) || 10, 1), 100);

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize
  };
}

export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    data: items,
    meta: {
      total,
      page,
      pageSize,
      pageCount: Math.max(Math.ceil(total / pageSize), 1)
    }
  };
}
