import { ToastService } from '@app/services/toast.service';
import { UnreadSnapshot } from '../services/chat.service';
import { inject } from '@angular/core';
import { Injectable, OnDestroy } from '@angular/core';
import { RequestStatus } from '@app/constants/request-status.const';
import { Action, NgxsAfterBootstrap, Selector, State, StateContext } from '@ngxs/store';
import { catchError, EMPTY, Subscription, tap } from 'rxjs';
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
  private readonly toast = inject(ToastService);
  private readonly receipts = new Map<number, string>();
  private readonly seen = new Set<number>();
  private epoch = 0;
  private notified = false;
  private snapshot(ctx: StateContext<IChatState>, value: UnreadSnapshot): void {
    if (value.revision < ctx.getState().unreadRevision) return;
    ctx.patchState({
      unreadRevision: value.revision,
      unread: value.unread,
      showWarning: Object.values(value.unread).some((count) => count > 0),
    });
  }
  private refreshUnread(ctx: StateContext<IChatState>): void {
    const epoch = this.epoch;
    this.subscriptions.add(
      this.chatService.requestUnread().subscribe({
        next: (value) => {
          if (epoch !== this.epoch || !ctx.getState().login) return;
          this.snapshot(ctx, value);
          if (!this.notified) {
            this.notified = true;
            const count = ChatState.unreadCount(ctx.getState());
            if (count > 0) {
              this.toast.show({
                header: 'Непрочитанные сообщения',
                body: `В чатах вас ждут сообщения: ${count}. Откройте чат в шапке сайта.`,
                delay: 12000,
              });
              ctx.dispatch(new ChatActions.EnableWarning());
            }
          }
        },
        error: () => {},
      }),
    );
  }
  private withReceipt(message: import('../interfaces/message.interface').IMessage) {
    const read_at = message.id ? this.receipts.get(message.id) : undefined;
    return read_at ? { ...message, read: true, read_at } : message;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngxsAfterBootstrap(ctx: StateContext<IChatState>): void {
    this.subscriptions.add(
      this.chatService.connected$.subscribe((isConnected) => {
        ctx.patchState({ isConnected });
        if (isConnected) {
          ctx.dispatch(new ChatActions.RequestDialogs());
          this.refreshUnread(ctx);
          const recipient = ctx.getState().recepient;
          if (recipient) ctx.dispatch(new ChatActions.RequestMessages(recipient));
        } else {
          ctx.patchState({
            messages: ctx
              .getState()
              .messages.map((message) =>
                message.status === 'sending' ? { ...message, status: 'failed' as const } : message,
              ),
          });
        }
      }),
    );
    this.subscriptions.add(
      this.chatService.messages$.subscribe((message) => {
        ctx.dispatch(new ChatActions.SetMessages([message]));
      }),
    );
    this.subscriptions.add(
      this.chatService.events$.subscribe((event) => {
        if (event.type === 'unread') this.snapshot(ctx, event);
        if (event.type === 'read') {
          event.ids.forEach((id) => this.receipts.set(id, event.read_at));
          ctx.patchState({ messages: ctx.getState().messages.map((message) => this.withReceipt(message)) });
        }
        if (event.type === 'send_failed')
          ctx.patchState({
            messages: ctx
              .getState()
              .messages.map((message) =>
                message.client_id && message.client_id === event.client_id
                  ? { ...message, status: 'failed' as const }
                  : message,
              ),
          });
      }),
    );
  }

  @Action(ChatActions.Connect)
  connectToChat(ctx: StateContext<IChatState>, action: ChatActions.Connect): void {
    ctx.patchState({ login: action.login });
    this.chatService.connect(action.login, action.token);
  }

  @Action(ChatActions.SetMessages)
  setMessages(ctx: StateContext<IChatState>, action: ChatActions.SetMessages): void {
    for (const raw of action.payload) {
      const state = ctx.getState();
      const message = this.withReceipt(raw);
      if (!state.login || (message.recipient !== state.login && message.sender !== state.login)) continue;
      const own = message.sender === state.login;
      if (own && !message.id) continue;
      const companion = own ? message.recipient : message.sender;
      const inDialog = state.recepient === companion;
      const active =
        state.isOpened && inDialog && document.visibilityState !== 'hidden' && document.hasFocus();
      const duplicate = message.id ? this.seen.has(message.id) : false;
      if (message.id) {
        this.seen.add(message.id);
        if (this.seen.size > 2000) this.seen.delete(this.seen.values().next().value!);
      }
      const dialog = {
        companion,
        last_message: message.body,
        last_message_time: message.created_at ?? new Date().toISOString(),
      };
      ctx.patchState({
        messages: inDialog ? mergeMessages(state.messages, [message]) : state.messages,
        dialogs: mergeDialogs([dialog], state.dialogs),
      });
      if (own || duplicate || message.read) continue;
      ctx.patchState({
        isOpened: true,
        recepient: state.isOpened ? state.recepient : null,
        unread: message.id
          ? state.unread
          : { ...state.unread, [companion]: (state.unread[companion] ?? 0) + 1 },
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
    if (message) ctx.patchState({ messages: mergeMessages(ctx.getState().messages, [message]) });
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
    const previous = ctx.getState().recepient;
    if (previous && previous !== action.payload) this.chatService.sendTyping(previous, false);
    ctx.patchState({ recepient: action.payload });
  }

  @Action(ChatActions.RequestDialogs)
  public dialogsRequest(ctx: StateContext<IChatState>, action: ChatActions.RequestDialogs) {
    ctx.patchState({
      dialogRequestStatus: RequestStatus.Pending,
    });

    const epoch = this.epoch;
    return this.chatService.requestDialogs().pipe(
      tap((response) => {
        if (epoch === this.epoch) ctx.dispatch(new ChatActions.RequestDialogsSuccess(response));
      }),
      catchError(() => (epoch === this.epoch ? ctx.dispatch(new ChatActions.RequestDialogsFail()) : EMPTY)),
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

    const epoch = this.epoch;
    return this.chatService.requestMessages(action.recipient).pipe(
      tap((response) => {
        if (epoch === this.epoch) ctx.dispatch(new ChatActions.RequestMessagesSuccess(response));
      }),
      catchError(() => (epoch === this.epoch ? ctx.dispatch(new ChatActions.RequestMessagesFail()) : EMPTY)),
    );
  }

  @Action(ChatActions.RequestMessagesSuccess)
  public messagesRequestSuccess(ctx: StateContext<IChatState>, action: ChatActions.RequestMessagesSuccess) {
    ctx.patchState({
      messagesReqeustStatus: RequestStatus.Load,
      messages: mergeMessages(action.payload, ctx.getState().messages).map((message) =>
        this.withReceipt(message),
      ),
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
    ++this.epoch;
    this.notified = false;
    this.receipts.clear();
    this.seen.clear();
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
