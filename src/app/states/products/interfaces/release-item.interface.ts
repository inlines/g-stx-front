export interface IReleaseItem {
  release_id: number;
  release_date: number | null;
  release_region: string;
  release_status: number;
  platform_name: string;
  platform_id: number;
  owned?: boolean;
  wished?: boolean;
  bided?: boolean;
  bid_user_logins: string[];
  digital_only: boolean,
  serial: string[] | null;
}