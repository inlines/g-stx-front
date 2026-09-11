export type ProductSort = 'name' | 'date' | 'rating';

/** Query fields supported by the existing Rust Pagination contract. */
export interface IProductListRequest {
  limit?: number;
  offset?: number;
  query?: string;
  regions?: string;
  sort?: ProductSort;
  local_multiplayer?: boolean;
  online_multiplayer?: boolean;
  cat?: number;
  franchise_id?: number;
  company_id?: number;
  company_role?: 'developer' | 'publisher';
  include_unreleased?: boolean;
  ignore_digital?: boolean;
}
