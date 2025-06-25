export interface IReleaseItem {
  release_id: number;
  release_date: number | null;
  release_region: string;
  platform_name: string;
  prlatform_generation: number;
  owned?: boolean;
  wished?: boolean;
}