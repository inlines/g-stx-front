import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IMessage } from '@app/states/chat/interfaces/message.interface';
// src/app/components/chat/chat.component.ts
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
import { ToastService } from '@app/services/toast.service';
import { AuthState } from '@app/states/auth/states/auth.state';
import { IDialog } from '@app/states/chat/interfaces/dialog.interface';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { ChatState } from '@app/states/chat/states/chat.state';
import { Actions, ofActionCompleted, Store } from '@ngxs/store';
import { debounceTime, map, Observable, withLatestFrom } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, AsyncPipe, DatePipe, TrapScrollDirective, NgClass, DatePipe],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollbox') scrollbox!: ElementRef;

  messages$!: Observable<IMessage[]>;
  isConnected$!: Observable<boolean>;
  login$!: Observable<string | null>;
  recepient$!: Observable<string | null>;

  message: string = '';
  login: string = '';

  public selectedDialog: IDialog | null = null;

  public dialogs$!: Observable<IDialog[]>;

  constructor(
    private store: Store,
    private actions$: Actions,
    private toastService: ToastService,
  ) {}

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

    this.store.dispatch(new ChatActions.Connect(this.store.selectSnapshot(AuthState.login) || ''));

    this.actions$
      .pipe(ofActionCompleted(ChatActions.SetMessages), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.isOpen) {
          if (this.scrollbox) {
            this.scrollbox.nativeElement.scrollTop = this.scrollbox.nativeElement.scrollHeight;
            const message = this.scrollbox.nativeElement.querySelector('.message-item:last-child');
            message?.classList.add('highlight');
            setTimeout(() => message?.classList.remove('highlight'), 1000);
          }
        }
      });
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
    // Закрытие соединения при уничтожении компонента
    this.store.dispatch(new ChatActions.Reset());
  }

  public isOpen = true;

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
