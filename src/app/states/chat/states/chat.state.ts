import { Injectable, OnDestroy } from '@angular/core';
import { RequestStatus } from '@app/constants/request-status.const';
import { Action, NgxsAfterBootstrap, Selector, State, StateContext } from '@ngxs/store';
import { catchError, Subscription, tap } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { ChatActions } from './chat-actions';
import { CHAT_STATE_DEFAULTS } from './chat.state-default.const';
import { IChatState } from './chat.state.interface';
import { mergeDialogs, mergeMessages } from './chat-merge';

@State<IChatState>({
  name: 'chat',
  defaults: CHAT_STATE_DEFAULTS,
})
@Injectable()
export class ChatState implements NgxsAfterBootstrap, OnDestroy {
  constructor(private chatService: ChatService) {}

  private readonly subscriptions = new Subscription();

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngxsAfterBootstrap(ctx: StateContext<IChatState>): void {
    this.subscriptions.add(
      this.chatService.connected$.subscribe((isConnected) => {
        ctx.patchState({ isConnected });
        if (isConnected) ctx.dispatch(new ChatActions.RequestDialogs());
      }),
    );
    this.subscriptions.add(
      this.chatService.messages$.subscribe((message) => {
        ctx.dispatch(new ChatActions.SetMessages([message]));
      }),
    );
  }

  @Action(ChatActions.Connect)
  connectToChat(ctx: StateContext<IChatState>, action: ChatActions.Connect): void {
    this.chatService.connect(action.login, action.token);
    ctx.patchState({
      login: action.login,
    });
  }

  @Action(ChatActions.SetMessages)
  setMessages(ctx: StateContext<IChatState>, action: ChatActions.SetMessages): void {
    for (const message of action.payload) {
      const state = ctx.getState();
      if (!state.login || message.recipient !== state.login || message.sender === state.login) continue;
      const active = state.isOpened && state.recepient === message.sender;
      const dialog = {
        companion: message.sender,
        last_message: message.body,
        last_message_time: message.created_at ?? new Date().toISOString(),
      };
      ctx.patchState({
        isOpened: true,
        recepient: state.isOpened ? state.recepient : null,
        messages: active ? [...state.messages, message] : state.messages,
        dialogs: [dialog, ...state.dialogs.filter((item) => item.companion !== message.sender)],
        unread: active
          ? state.unread
          : { ...state.unread, [message.sender]: (state.unread[message.sender] ?? 0) + 1 },
        notification: {
          sequence: (state.notification?.sequence ?? 0) + 1,
          sender: message.sender,
          active,
          message,
        },
      });
      if (!active) ctx.dispatch(new ChatActions.EnableWarning());
    }
  }

  @Action(ChatActions.SendMessage)
  sendMessage(ctx: StateContext<IChatState>, action: ChatActions.SendMessage): void {
    const message = this.chatService.sendMessage(action.payload);
    if (message) ctx.patchState({ messages: [...ctx.getState().messages, message] });
  }

  @Action(ChatActions.ToggleChatVisibility)
  toggleVivibility(ctx: StateContext<IChatState>): void {
    const state = ctx.getState();
    if (!state.isOpened) {
      ctx.dispatch(new ChatActions.RequestDialogs());
    }
    ctx.patchState({
      isOpened: !state.isOpened,
      showWarning: false,
    });
  }

  @Action(ChatActions.SetRecepient)
  setRecepient(ctx: StateContext<IChatState>, action: ChatActions.SetRecepient): void {
    const unread = { ...ctx.getState().unread };
    if (action.payload) delete unread[action.payload];
    ctx.patchState({ recepient: action.payload, unread, showWarning: Object.keys(unread).length > 0 });
  }

  @Action(ChatActions.RequestDialogs)
  public dialogsRequest(ctx: StateContext<IChatState>, action: ChatActions.RequestDialogs) {
    ctx.patchState({
      dialogRequestStatus: RequestStatus.Pending,
    });

    return this.chatService.requestDialogs().pipe(
      tap((response) => {
        ctx.dispatch(new ChatActions.RequestDialogsSuccess(response));
      }),
      catchError(() => ctx.dispatch(new ChatActions.RequestDialogsFail())),
    );
  }

  @Action(ChatActions.RequestDialogsSuccess)
  public dialogsRequestSuccess(ctx: StateContext<IChatState>, action: ChatActions.RequestDialogsSuccess) {
    ctx.patchState({
      dialogRequestStatus: RequestStatus.Load,
      dialogs: mergeDialogs(action.payload, ctx.getState().dialogs),
    });
  }

  @Action(ChatActions.RequestDialogsFail)
  public dialogsRequestFail(ctx: StateContext<IChatState>) {
    ctx.patchState({
      dialogRequestStatus: RequestStatus.Error,
    });
  }

  @Action(ChatActions.RequestMessages, { cancelUncompleted: true })
  public messagesRequest(ctx: StateContext<IChatState>, action: ChatActions.RequestMessages) {
    ctx.patchState({
      messagesReqeustStatus: RequestStatus.Pending,
      messages: [],
    });

    return this.chatService.requestMessages(action.recipient).pipe(
      tap((response) => {
        ctx.dispatch(new ChatActions.RequestMessagesSuccess(response));
      }),
      catchError(() => ctx.dispatch(new ChatActions.RequestMessagesFail())),
    );
  }

  @Action(ChatActions.RequestMessagesSuccess)
  public messagesRequestSuccess(ctx: StateContext<IChatState>, action: ChatActions.RequestMessagesSuccess) {
    ctx.patchState({
      messagesReqeustStatus: RequestStatus.Load,
      messages: mergeMessages(action.payload, ctx.getState().messages),
    });
  }

  @Action(ChatActions.RequestMessagesFail)
  public messagesRequestFail(ctx: StateContext<IChatState>) {
    ctx.patchState({
      messagesReqeustStatus: RequestStatus.Error,
    });
  }

  @Action(ChatActions.Reset)
  public reset(ctx: StateContext<IChatState>) {
    this.chatService.closeConnection();
    ctx.setState(CHAT_STATE_DEFAULTS);
  }

  @Action(ChatActions.EnableWarning)
  public enableWarning(ctx: StateContext<IChatState>) {
    const snd = new Audio('/audio/message.mp3');
    void snd.play().catch(() => {
      /* Browser autoplay policy may require a user gesture. */
    });
    ctx.patchState({
      showWarning: true,
    });
  }

  @Action(ChatActions.DisableWarning)
  public disableWarning(ctx: StateContext<IChatState>) {
    ctx.patchState({
      showWarning: false,
    });
  }

  @Selector()
  public static notification(state: IChatState) {
    return state.notification;
  }

  @Selector()
  public static unreadCount(state: IChatState): number {
    return Object.values(state.unread).reduce((total, count) => total + count, 0);
  }

  @Selector()
  public static unread(state: IChatState) {
    return state.unread;
  }

  @Selector()
  public static unreadDialogs(state: IChatState) {
    return state.dialogs.filter((dialog) => (state.unread[dialog.companion] ?? 0) > 0);
  }

  @Selector()
  public static isConnected(state: IChatState) {
    return state.isConnected;
  }

  @Selector()
  public static messages(state: IChatState) {
    return state.messages;
  }

  @Selector()
  public static visible(state: IChatState) {
    return state.isOpened;
  }

  @Selector()
  public static recepient(state: IChatState) {
    return state.recepient;
  }

  @Selector()
  public static dialogs(state: IChatState) {
    return [...state.dialogs].sort(
      (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime(),
    );
  }

  @Selector()
  public static showWarning(state: IChatState) {
    return state.showWarning;
  }
}
