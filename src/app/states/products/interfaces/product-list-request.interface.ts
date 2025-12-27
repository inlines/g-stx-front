export interface IProductListRequest {
  limit?: number;
  offset?: number;
  query?: string;
  franschise?: string;
  developer?: string;
  publisher?: string;
  sort?: string;
  cat?: number;
  ignore_digital?: boolean;
}