// src/app/state/chat.state.ts
import { Injectable, OnDestroy } from '@angular/core';
import { RequestStatus } from '@app/constants/request-status.const';
import { Action, NgxsAfterBootstrap, Selector, State, StateContext } from '@ngxs/store';
import { catchError, Subscription, tap } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { ChatActions } from './chat-actions';
import { CHAT_STATE_DEFAULTS } from './chat.state-default.const';
import { IChatState } from './chat.state.interface';

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
    this.chatService.connect(action.login);
    ctx.patchState({
      login: action.login,
    });
  }

  @Action(ChatActions.SetMessages)
  setMessages(ctx: StateContext<IChatState>, action: ChatActions.SetMessages): void {
    const state = ctx.getState();
    const currentRecipient = state.recepient;
    if (state.isOpened) {
      if (action.payload.every((mes) => mes.sender === currentRecipient)) {
        ctx.patchState({
          messages: [...state.messages, ...action.payload],
        });
      } else {
        ctx.dispatch(new ChatActions.RequestDialogs());
      }
    } else {
      ctx.dispatch(new ChatActions.RequestDialogs());
      ctx.dispatch(new ChatActions.EnableWarning());
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
    ctx.patchState({
      recepient: action.payload,
    });
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
      dialogs: action.payload,
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
      messages: action.payload,
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
    let snd = new Audio('/audio/message.mp3');
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
