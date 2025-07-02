// src/app/state/chat.state.ts
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { CHAT_STATE_DEFAULTS } from './chat.state-default.const';
import { IChatState } from './chat.state.interface';
import { ChatActions } from './chat-actions';
import { ChatService } from '../services/chat.service';
import { RequestStatus } from '@app/constants/request-status.const';
import { catchError, tap } from 'rxjs';
import { IMessage } from '../interfaces/message.interface';

@State<IChatState>({
  name: 'chat',
  defaults: CHAT_STATE_DEFAULTS,
})
@Injectable()
export class ChatState {
  constructor(private chatService: ChatService) {}

  @Action(ChatActions.Connect)
  connectToChat(
    ctx: StateContext<IChatState>,
    action: ChatActions.Connect
  ): void {
    this.chatService.connect(action.login);
    this.chatService.doStateCheck();
    ctx.patchState({
      isConnected: true,
      login: action.login,
    });
  }

  @Action(ChatActions.SetMessages)
  setMessages(
    ctx: StateContext<IChatState>,
    action: ChatActions.SetMessages
  ): void {
    console.warn('incoming messages');
    console.warn(action.payload);
    const state = ctx.getState();
    ctx.patchState({
      messages: [...state.messages, ...action.payload],
    });
  }

  @Action(ChatActions.SendMessage)
  sendMessage(
    ctx: StateContext<IChatState>,
    action: ChatActions.SendMessage
  ): void {
    this.chatService.sendMessage(action.payload);
    const state = ctx.getState();
    ctx.patchState({
      messages: [...state.messages, action.payload],
    });
  }

  @Action(ChatActions.ToggleChatVisibility)
  toggleVivibility(
    ctx: StateContext<IChatState>,
  ): void {
    const state = ctx.getState();
    if(!state.isOpened) {
      ctx.dispatch(new ChatActions.RequestDialogs());
    }
    ctx.patchState({
      isOpened: !state.isOpened
    });
  }

  @Action(ChatActions.SetRecepient)
  setRecepient(
    ctx: StateContext<IChatState>,
    action: ChatActions.SetRecepient
  ): void {
    ctx.patchState({
      recepient: action.payload
    });
  }


  @Action(ChatActions.RequestDialogs)
  public dialogsRequest(ctx: StateContext<IChatState>, action: ChatActions.RequestDialogs) {
    ctx.patchState({
      dialogReqeustStatus: RequestStatus.Pending,
    });

    return this.chatService.requestDialogs().pipe(
      tap((response) => {
        ctx.dispatch(new ChatActions.RequestDialogsSuccess(response))
      }),
      catchError((err, caught) => ctx.dispatch(new ChatActions.RequestDialogsFail()))
    );
  }

  @Action(ChatActions.RequestDialogsSuccess)
  public dialogsRequestSuccess(ctx: StateContext<IChatState>, action: ChatActions.RequestDialogsSuccess) {
    ctx.patchState({
      dialogReqeustStatus: RequestStatus.Load,
      dialogs: action.payload
    });
  }

  @Action(ChatActions.RequestDialogsFail)
  public dialogsRequestFail(ctx: StateContext<IChatState>) {
    ctx.patchState({
      dialogReqeustStatus: RequestStatus.Error,
    });
  }

  @Action(ChatActions.RequestMessages)
  public messagesRequest(ctx: StateContext<IChatState>, action: ChatActions.RequestMessages) {
    ctx.patchState({
      messagesReqeustStatus: RequestStatus.Pending,
      messages: []
    });

    return this.chatService.requestMessages(action.recipient).pipe(
      tap((response) => {
        ctx.dispatch(new ChatActions.RequestMessagesSuccess(response))
      }),
      catchError((err, caught) => ctx.dispatch(new ChatActions.RequestMessagesFail()))
    );
  }

  @Action(ChatActions.RequestMessagesSuccess)
  public messagesRequestSuccess(ctx: StateContext<IChatState>, action: ChatActions.RequestMessagesSuccess) {
    ctx.patchState({
      messagesReqeustStatus: RequestStatus.Load,
      messages: action.payload
    });
  }

  @Action(ChatActions.RequestMessagesFail)
  public messagesRequestFail(ctx: StateContext<IChatState>) {
    ctx.patchState({
      messagesReqeustStatus: RequestStatus.Error,
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
    return state.dialogs;
  }
}
