export type ProductSort = 'name' | 'date';

/** Query fields supported by the existing Rust Pagination contract. */
export interface IProductListRequest {
  limit?: number;
  offset?: number;
  query?: string;
  sort?: ProductSort;
  cat?: number;
  franchise_id?: number;
  company_id?: number;
  company_role?: 'developer' | 'publisher';
  ignore_digital?: boolean;
}
