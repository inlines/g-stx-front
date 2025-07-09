// src/app/state/chat.state.ts
import { State, Action, StateContext, Selector, NgxsAfterBootstrap } from '@ngxs/store';
import { Injectable, OnDestroy } from '@angular/core';
import { CHAT_STATE_DEFAULTS } from './chat.state-default.const';
import { IChatState } from './chat.state.interface';
import { ChatActions } from './chat-actions';
import { ChatService } from '../services/chat.service';
import { RequestStatus } from '@app/constants/request-status.const';
import { catchError, Subscription, tap } from 'rxjs';

@State<IChatState>({
  name: 'chat',
  defaults: CHAT_STATE_DEFAULTS,
})
@Injectable()
export class ChatState implements NgxsAfterBootstrap, OnDestroy {
  constructor(private chatService: ChatService) {
  }

  private connectionSub!: Subscription;

  ngOnDestroy(): void {
    this.connectionSub.unsubscribe();
  }

  ngxsAfterBootstrap(ctx: StateContext<IChatState>): void {
    this.connectionSub = this.chatService.connected$.subscribe((isConnected) => {
      ctx.patchState({ isConnected });
    });
  }

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
    const state = ctx.getState();
    const currentRecipient = state.recepient;
    if(state.isOpened) {
      if(action.payload.every(mes => mes.sender === currentRecipient)) {
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
      isOpened: !state.isOpened,
      showWarning: false,
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

  @Action(ChatActions.Reset)
  public reset(ctx: StateContext<IChatState>) {
    this.chatService.closeConnection();
    ctx.setState(CHAT_STATE_DEFAULTS);
  }

  @Action(ChatActions.EnableWarning)
  public enableWarning(ctx: StateContext<IChatState>) {
    let snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");  
    snd.play();
    ctx.patchState({
      showWarning: true
    });
  }

  @Action(ChatActions.DisanleWarning)
  public disableWarning(ctx: StateContext<IChatState>) {
    ctx.patchState({
      showWarning: false
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
    return state.dialogs.sort((a,b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());
  }

  @Selector()
  public static showWarning(state: IChatState) {
    return state.showWarning;
  }

}
