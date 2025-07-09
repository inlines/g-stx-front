export interface IProductListRequest {
  limit?: number;
  offset?: number;
  query?: string;
  cat?: number;
  ignore_digital?: boolean;
}