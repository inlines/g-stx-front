export interface IReleaseItem {
  release_id: number;
  release_date: number | null;
  release_region: string;
  release_status: number;
  platform_name: string;
  platform_id: number;
  owned?: boolean;
  wished?: boolean;
  forSale?: boolean;
  seller_logins: string[];
  digital_only: boolean;
  serial: string[] | null;
}
