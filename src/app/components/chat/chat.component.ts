import { ChatViewportDirective } from '@app/directives/chat-viewport.directive';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { ChatService } from '@app/states/chat/services/chat.service';
import { DestroyRef, inject, Injector, afterNextRender, NgZone } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IMessage } from '@app/states/chat/interfaces/message.interface';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrapScrollDirective } from '@app/directives/trap-scroll.directive';
import { AuthState } from '@app/states/auth/states/auth.state';
import { IDialog } from '@app/states/chat/interfaces/dialog.interface';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { ChatState } from '@app/states/chat/states/chat.state';
import { Store } from '@ngxs/store';
import {
  debounceTime,
  map,
  Observable,
  withLatestFrom,
  timer,
  fromEvent,
  combineLatest,
  distinctUntilChanged,
} from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    ChatViewportDirective,
    UserAvatarComponent,
    FormsModule,
    AsyncPipe,
    DatePipe,
    TrapScrollDirective,
    NgClass,
  ],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollbox') scrollbox!: ElementRef;

  messages$!: Observable<IMessage[]>;
  isConnected$!: Observable<boolean>;
  login$!: Observable<string | null>;
  recepient$!: Observable<string | null>;

  message: string = '';

  public dialogs$!: Observable<IDialog[]>;

  private readonly store = inject(Store);

  private readonly injector = inject(Injector);
  private readonly zone = inject(NgZone);
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  private readonly chatService = inject(ChatService);
  readonly online$ = this.chatService.online$;
  readonly typing$ = this.chatService.typing$;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private typingRecipient: string | null = null;
  private lastTyping = 0;
  private readonly sentReads = new Map<number, number>();
  readonly unread$ = this.store.select(ChatState.unread);
  readonly unreadDialogs$ = this.store.select(ChatState.unreadDialogs);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.messages$
      .pipe(
        distinctUntilChanged(
          (a, b) =>
            a.length === b.length &&
            a.at(-1)?.id === b.at(-1)?.id &&
            a.at(-1)?.created_at === b.at(-1)?.created_at &&
            a.at(-1)?.body === b.at(-1)?.body,
        ),
        debounceTime(50),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.scrollbox) {
          this.scrollbox.nativeElement.scrollTop = this.scrollbox.nativeElement.scrollHeight;
          this.markVisibleRead();
        }
      });
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() =>
      timer(0, 2000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.markVisibleRead()),
    );
    fromEvent(document, 'visibilitychange')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (document.visibilityState === 'hidden') this.stopTyping();
        else this.markVisibleRead();
      });
    fromEvent(window, 'blur')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.stopTyping());
    fromEvent(window, 'focus')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.markVisibleRead());
    combineLatest([this.store.select(ChatState.visible), this.store.select(ChatState.recepient)])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([visible, recipient]) => {
        if (!visible || recipient !== this.typingRecipient) this.stopTyping();
      });
    this.isConnected$ = this.store.select(ChatState.isConnected);
    this.login$ = this.store.select(AuthState.login);
    this.recepient$ = this.store.select(ChatState.recepient);
    this.dialogs$ = this.store.select(ChatState.dialogs);
    this.messages$ = this.store.select(ChatState.messages).pipe(
      withLatestFrom(this.login$),
      map(([messages, login]) =>
        messages.map((m) => ({
          ...m,
          own: m.sender === login,
          sender: m.sender === login ? 'Вы' : m.sender,
        })),
      ),
    );

    this.store.dispatch(
      new ChatActions.Connect(
        this.store.selectSnapshot(AuthState.login) || '',
        this.store.selectSnapshot(AuthState.token) || '',
      ),
    );

    this.store
      .select(ChatState.notification)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => {
        if (!notification) return;
        afterNextRender(
          () => {
            if (!this.store.selectSnapshot(ChatState.visible)) return;
            const recipient = this.store.selectSnapshot(ChatState.recepient);
            if (notification.active && recipient === notification.sender) {
              const messages = this.store.selectSnapshot(ChatState.messages);
              let index = -1;
              messages.forEach((message, position) => {
                if (
                  message.sender === notification.message.sender &&
                  message.body === notification.message.body &&
                  message.created_at === notification.message.created_at
                )
                  index = position;
              });
              const element = this.scrollbox?.nativeElement.querySelector(`[data-message-index="${index}"]`);
              if (element) {
                this.scrollbox.nativeElement.scrollTop = this.scrollbox.nativeElement.scrollHeight;
                this.highlight(element);
              }
            } else {
              const elements = this.host.nativeElement.querySelectorAll<HTMLElement>('[data-companion]');
              for (const element of elements)
                if (element.dataset['companion'] === notification.sender) this.highlight(element);
            }
          },
          { injector: this.injector },
        );
      });
  }

  private highlight(element: HTMLElement): void {
    clearTimeout(this.timers.get(element));
    element.classList.remove('highlight');
    void element.offsetWidth;
    element.classList.add('highlight');
    const timer = setTimeout(() => {
      element.classList.remove('highlight');
      this.timers.delete(element);
    }, 1400);
    this.timers.set(element, timer);
  }

  sendMessage(): void {
    const recipient = this.store.selectSnapshot(ChatState.recepient);
    if (!recipient || !this.message.trim() || !this.store.selectSnapshot(ChatState.isConnected)) return;
    this.store.dispatch(
      new ChatActions.SendMessage({
        sender: this.store.selectSnapshot(AuthState.login) ?? '',
        recipient,
        body: this.message,
      }),
    );
    this.message = '';
    this.stopTyping();
  }

  markVisibleRead(): void {
    if (
      document.visibilityState !== 'visible' ||
      !document.hasFocus() ||
      !this.store.selectSnapshot(ChatState.visible) ||
      !this.store.selectSnapshot(ChatState.isConnected)
    )
      return;
    const recipient = this.store.selectSnapshot(ChatState.recepient);
    const box = this.scrollbox?.nativeElement as HTMLElement | undefined;
    if (!recipient || !box) return;
    const bounds = box.getBoundingClientRect();
    if (!bounds.height) return;
    const login = this.store.selectSnapshot(AuthState.login);
    const unread = new Set(
      this.store
        .selectSnapshot(ChatState.messages)
        .filter((m) => m.id && !m.read && m.recipient === login && m.sender === recipient)
        .map((m) => m.id!),
    );
    const now = Date.now();
    const ids: number[] = [];
    for (const element of box.querySelectorAll<HTMLElement>('[data-message-id]')) {
      const id = Number(element.dataset['messageId']);
      const rect = element.getBoundingClientRect();
      if (
        unread.has(id) &&
        rect.bottom > bounds.top &&
        rect.top < bounds.bottom &&
        now - (this.sentReads.get(id) ?? 0) >= 1500
      ) {
        const y = (Math.max(rect.top, bounds.top) + Math.min(rect.bottom, bounds.bottom)) / 2;
        const x = (Math.max(rect.left, bounds.left) + Math.min(rect.right, bounds.right)) / 2;
        const top = document.elementFromPoint?.(x, y);
        if (!top || !element.contains(top)) continue;
        ids.push(id);
        this.sentReads.set(id, now);
        if (ids.length === 100) break;
      }
    }
    for (const id of this.sentReads.keys()) if (!unread.has(id)) this.sentReads.delete(id);
    this.chatService.readMessages(ids);
  }
  onDraftChange(): void {
    const recipient = this.store.selectSnapshot(ChatState.recepient);
    if (!recipient || !this.message.trim()) {
      this.stopTyping();
      return;
    }
    if (this.typingRecipient && this.typingRecipient !== recipient) this.stopTyping();
    this.typingRecipient = recipient;
    if (Date.now() - this.lastTyping >= 1000) {
      this.chatService.sendTyping(recipient, true);
      this.lastTyping = Date.now();
    }
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.stopTyping(), 2500);
  }
  stopTyping(): void {
    clearTimeout(this.typingTimer);
    if (this.typingRecipient) this.chatService.sendTyping(this.typingRecipient, false);
    this.typingRecipient = null;
    this.lastTyping = 0;
  }
  retryMessage(message: IMessage): void {
    const recipient = this.store.selectSnapshot(ChatState.recepient);
    if (recipient)
      this.store.dispatch(
        new ChatActions.SendMessage({
          ...message,
          sender: this.store.selectSnapshot(AuthState.login) ?? '',
          recipient,
        }),
      );
  }
  ngOnDestroy(): void {
    this.stopTyping();
    this.timers.forEach((timer) => clearTimeout(timer));
    // Закрытие соединения при уничтожении компонента
    this.store.dispatch(new ChatActions.Reset());
  }

  public closeChat() {
    this.store.dispatch(new ChatActions.SetRecepient(null));
    this.store.dispatch(new ChatActions.ToggleChatVisibility());
  }

  public onFocus(): void {
    if (this.scrollbox) {
      this.scrollbox.nativeElement.scrollTop = this.scrollbox.nativeElement.scrollHeight;
    }
  }

  public setActiveDialog(dialog: IDialog | null) {
    if (dialog?.companion) {
      this.store.dispatch(new ChatActions.SetRecepient(dialog.companion));
      this.store.dispatch(new ChatActions.RequestMessages(dialog.companion));
    } else {
      this.store.dispatch(new ChatActions.RequestDialogs());
      this.store.dispatch(new ChatActions.SetRecepient(null));
    }
  }
}
