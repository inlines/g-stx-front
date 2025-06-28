export interface IReleaseItem {
  release_id: number;
  release_date: number | null;
  release_region: string;
  release_status: number;
  platform_name: string;
  prlatform_generation: number;
  owned?: boolean;
  wished?: boolean;
  bided?: boolean;
  bid_user_logins: string[];
}