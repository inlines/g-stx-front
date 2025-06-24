import { RequestStatus } from "@app/constants/request-status.const";
import { IOwnershipItem } from "../interfaces/ownership-item.interface";

export interface IownershipState {
  loadOwnershipStatus: RequestStatus;
  ownership: IOwnershipItem[];
}