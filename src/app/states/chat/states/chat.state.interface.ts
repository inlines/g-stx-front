import { RequestStatus } from "@app/constants/request-status.const";
import { IDialog } from "../interfaces/dialog.interface";
import { IMessage } from "../interfaces/message.interface";

export interface IChatState {
  messages: IMessage[];
  isConnected: boolean;
  login: string | null;
  isOpened: boolean;
  recepient: string | null;
  dialogs: IDialog[];
  dialogReqeustStatus: RequestStatus;
  messagesReqeustStatus: RequestStatus;
  showWarning: boolean;
}