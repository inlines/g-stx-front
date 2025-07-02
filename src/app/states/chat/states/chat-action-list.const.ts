export enum ChatActionList {
  CONNECT = '[CHAT] connect',
  SEND_MESSAGE = '[CHAT] send message',
  SET_MESSAGES = '[CHAT] set messages',
  SET_RECIPIENT = '[CHAT] set recepient',

  REQUEST_DIALOGS = '[CHAT] request dialogs',
  REQUEST_DIALOGS_FAIL = '[CHAT] request dialogs fail',
  REQUEST_DIALOGS_SUCCESS = '[CHAT] request dialogs success',

  REQUEST_MESSAGES = '[CHAT] request messages',
  REQUEST_MESSAGES_FAIL = '[CHAT] request messages fail',
  REQUEST_MESSAGES_SUCCESS = '[CHAT] request messages success',

  TOGGLE_CHAT_VISIBILITY = '[CHAT] toggle visivility',

  ENABLE_CHAT_WARNING = '[CHAT] enable warning',
  DISABLE_CHAT_WARNING = '[CHAT] disable warning',

  RESET_STATE = '[CHAT] reset state',
}