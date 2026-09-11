import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';

export const CATALOG_PAGE_SIZE = 15;
export const PERSONAL_LIST_PAGE_SIZE = 1000;

/** Explicit allowlist also removes obsolete fields restored from local storage. */
export function normalizeListParams(params: IProductListRequest): IProductListRequest {
  const result: IProductListRequest = {};
  if (Number.isFinite(params.cat)) result.cat = Math.max(0, Math.trunc(params.cat!));
  if (Number.isFinite(params.limit)) result.limit = Math.max(1, Math.trunc(params.limit!));
  if (Number.isFinite(params.offset)) result.offset = Math.max(0, Math.trunc(params.offset!));
  if (Number.isInteger(params.franchise_id) && params.franchise_id! > 0)
    result.franchise_id = params.franchise_id;
  if (Number.isInteger(params.company_id) && params.company_id! > 0) result.company_id = params.company_id;
  if (params.company_role === 'developer' || params.company_role === 'publisher')
    result.company_role = params.company_role;
  const query = params.query?.trim();
  if (query) result.query = query;
  if (params.sort) result.sort = params.sort === 'date' || params.sort === 'rating' ? params.sort : 'name';
  if (typeof params.ignore_digital === 'boolean') result.ignore_digital = params.ignore_digital;
  if (typeof params.local_multiplayer === 'boolean') result.local_multiplayer = params.local_multiplayer;
  if (typeof params.online_multiplayer === 'boolean') result.online_multiplayer = params.online_multiplayer;
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
    a.local_multiplayer === b.local_multiplayer &&
    a.online_multiplayer === b.online_multiplayer &&
    a.franchise_id === b.franchise_id &&
    a.company_id === b.company_id &&
    a.company_role === b.company_role &&
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
