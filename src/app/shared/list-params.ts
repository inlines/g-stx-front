import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';

export const CATALOG_PAGE_SIZE = 15;
export const PERSONAL_LIST_PAGE_SIZE = 1000;

/** Explicit allowlist also removes obsolete fields restored from local storage. */
export function normalizeListParams(params: IProductListRequest): IProductListRequest {
  const result: IProductListRequest = {};
  if (Number.isFinite(params.cat)) result.cat = Math.max(0, Math.trunc(params.cat!));
  if (Number.isFinite(params.limit)) result.limit = Math.max(1, Math.trunc(params.limit!));
  if (Number.isFinite(params.offset)) result.offset = Math.max(0, Math.trunc(params.offset!));
  const query = params.query?.trim();
  if (query) result.query = query;
  if (params.sort) result.sort = params.sort === 'date' ? 'date' : 'name';
  if (typeof params.ignore_digital === 'boolean') result.ignore_digital = params.ignore_digital;
  return result;
}

export function catalogParams(params: IProductListRequest): IProductListRequest {
  return normalizeListParams({
    ...params,
    cat: params.cat || 6,
    limit: CATALOG_PAGE_SIZE,
    offset: params.offset ?? 0,
    sort: params.sort ?? 'date',
    ignore_digital: params.ignore_digital ?? true,
  });
}

export function sameListParams(a: IProductListRequest, b: IProductListRequest): boolean {
  return (
    a.cat === b.cat &&
    a.limit === b.limit &&
    a.offset === b.offset &&
    a.query === b.query &&
    a.sort === b.sort &&
    a.ignore_digital === b.ignore_digital
  );
}

export function listHttpParams(params: IProductListRequest): Record<string, string | number | boolean> {
  return { ...normalizeListParams(params) };
}
