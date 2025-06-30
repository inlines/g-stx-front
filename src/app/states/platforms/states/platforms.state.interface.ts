import { RequestStatus } from "@app/constants/request-status.const";
import { IPlatformItem } from "../interfaces/platform-item.interface";


export interface IplatformState {
  loadPlatformsStatus: RequestStatus;
  platforms: IPlatformItem[];
}