import { IDialog } from "../interfaces/dialog.interface";
import { IMessage } from "../interfaces/message.interface";
import { ChatActionList } from "./chat-action-list.const";

export namespace ChatActions {
  export class Connect {
    public static readonly type = ChatActionList.CONNECT;

    constructor(public login: string) {}
  }

  export class SendMessage {
    public static readonly type = ChatActionList.SEND_MESSAGE;

    constructor(public payload: IMessage){
    }
  }

  export class SetMessages {
    public static readonly type = ChatActionList.SET_MESSAGES;

    constructor(public payload: IMessage[]){
    }
  }

  export class SetRecepient {
    public static readonly type = ChatActionList.SET_RECIPIENT;

    constructor(public payload: string | null){
    }
  }

  export class ToggleChatVisibility {
    public static readonly type = ChatActionList.TOGGLE_CHAT_VISIBILITY;
  }

  export class RequestDialogs {
    public static readonly type = ChatActionList.REQUEST_DIALOGS;
  }

  export class RequestDialogsSuccess {
    public static readonly type = ChatActionList.REQUEST_DIALOGS_SUCCESS;
    constructor(public payload: IDialog[]){
    }
  }

  export class RequestDialogsFail {
    public static readonly type = ChatActionList.REQUEST_DIALOGS_FAIL;
  }

  export class RequestMessages {
    public static readonly type = ChatActionList.REQUEST_MESSAGES;
    constructor(public recipient: string){}
  }

  export class RequestMessagesSuccess {
    public static readonly type = ChatActionList.REQUEST_MESSAGES_SUCCESS;
    constructor(public payload: IMessage[]){
    }
  }

  export class RequestMessagesFail {
    public static readonly type = ChatActionList.REQUEST_MESSAGES_FAIL;
  }

  export class EnableWarning {
    public static readonly type = ChatActionList.ENABLE_CHAT_WARNING;
  }

  export class DisanleWarning {
    public static readonly type = ChatActionList.DISABLE_CHAT_WARNING;
  }

  export class Reset {
    public static readonly type = ChatActionList.RESET_STATE;
  }
}