import { RequestStatus } from "@app/constants/request-status.const";
import { IChatState } from "./chat.state.interface";

export const CHAT_STATE_DEFAULTS: IChatState = {
  messages: [],
  login: null,
  isConnected: false,
  isOpened: false,
  recepient: null,
  dialogRequestStatus: RequestStatus.NotInvoked,
  messagesReqeustStatus: RequestStatus.NotInvoked,
  dialogs: [],
  showWarning: false,
}