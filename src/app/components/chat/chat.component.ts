import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { ChatService } from '@app/states/chat/services/chat.service';
import { DestroyRef, inject, Injector, afterNextRender } from '@angular/core';
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
import { debounceTime, map, Observable, withLatestFrom } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [UserAvatarComponent, FormsModule, AsyncPipe, DatePipe, TrapScrollDirective, NgClass],
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
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly timers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
  readonly online$ = inject(ChatService).online$;
  readonly unread$ = this.store.select(ChatState.unread);
  readonly unreadDialogs$ = this.store.select(ChatState.unreadDialogs);
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    this.messages$.pipe(debounceTime(50), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.scrollbox) {
        this.scrollbox.nativeElement.scrollTop = this.scrollbox.nativeElement.scrollHeight;
      }
    });
  }

  ngOnInit(): void {
    this.isConnected$ = this.store.select(ChatState.isConnected);
    this.login$ = this.store.select(AuthState.login);
    this.recepient$ = this.store.select(ChatState.recepient);
    this.dialogs$ = this.store.select(ChatState.dialogs);
    this.messages$ = this.store.select(ChatState.messages).pipe(
      withLatestFrom(this.login$),
      map(([messages, login]) =>
        messages.map((m) => ({ ...m, sender: m.sender === login ? 'Вы' : m.sender })),
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
  }

  ngOnDestroy(): void {
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
