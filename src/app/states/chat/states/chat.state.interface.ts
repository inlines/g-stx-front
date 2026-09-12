import { RequestStatus } from '@app/constants/request-status.const';
import { IDialog } from '../interfaces/dialog.interface';
import { IMessage } from '../interfaces/message.interface';

export interface IChatState {
  messages: IMessage[];
  isConnected: boolean;
  login: string | null;
  isOpened: boolean;
  recepient: string | null;
  dialogs: IDialog[];
  dialogRequestStatus: RequestStatus;
  messagesReqeustStatus: RequestStatus;
  showWarning: boolean;
  unread: Record<string, number>;
  unreadRevision: number;
  notification: { sequence: number; sender: string; active: boolean; message: IMessage } | null;
}
