// src/app/components/chat/chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Store, Actions, ofActionCompleted } from '@ngxs/store';
import { debounceTime, filter, map, Observable, Subscription, take, withLatestFrom } from 'rxjs';
import { ChatState } from '@app/states/chat/states/chat.state';
import { AuthState } from '@app/states/auth/states/auth.state';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { IDialog } from '@app/states/chat/interfaces/dialog.interface';
import { ToastService } from '@app/services/toast.service';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [FormsModule, AsyncPipe, NgFor, NgIf, DatePipe],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('scrollbox') scrollbox!: ElementRef;

  messages$!: Observable<any[]>;
  isConnected$!: Observable<boolean>;
  login$!: Observable<string | null>;
  recepient$!: Observable<string | null>;

  message: string = '';
  login: string = '';

  public selectedDialog: IDialog | null = null;

  public dialogs$!: Observable<IDialog[]>;

  constructor(private store: Store, private actions$: Actions, private toastService: ToastService,) {}

  public subs: Subscription[] = [];
  
  ngAfterViewInit(): void {
    this.subs.push(this.messages$.pipe(debounceTime(500)).subscribe(() => {
      if(this.scrollbox) {
        this.scrollbox.nativeElement.scrollTop = this.scrollbox.nativeElement.scrollHeight;
      }
    }));
  }

  ngOnInit(): void {
    this.isConnected$ = this.store.select(ChatState.isConnected);
    this.login$ = this.store.select(AuthState.login);
    this.recepient$ = this.store.select(ChatState.recepient);
    this.dialogs$ = this.store.select(ChatState.dialogs);
    this.messages$ = this.store.select(ChatState.messages).pipe(
      withLatestFrom(this.login$),
      map(([messages, login]) => messages.map(m => ({...m, sender: m.sender === login ? 'Вы' : m.sender})))
    );
    
    this.store.dispatch(new ChatActions.Connect(this.store.selectSnapshot(AuthState.login) || ''));

    this.actions$.pipe(ofActionCompleted(ChatActions.SetMessages)).subscribe(
      () => {
        if(this.isOpen) {
          if(this.scrollbox) {
            this.scrollbox.nativeElement.scrollTop = this.scrollbox.nativeElement.scrollHeight;
          }
        }
      }
    )
  }

  sendMessage(): void {
    this.recepient$.pipe(
      filter(r => !!r),
      take(1)
    ).subscribe(recepient => {
        this.store.dispatch(new ChatActions.SendMessage({
        sender: this.store.selectSnapshot(AuthState.login) || '',
        recipient: recepient || '',
        body: this.message
      }));

      this.message = ''; // Очистка поля ввода
    })
  }

  ngOnDestroy(): void {
    // Закрытие соединения при уничтожении компонента
    this.subs.forEach(sub => sub.unsubscribe());
    this.store.dispatch(new ChatActions.Reset());
  }

  public isOpen = true;

  public closeChat() {
    this.store.dispatch(new ChatActions.SetRecepient(null));
    this.store.dispatch(new ChatActions.ToggleChatVisibility());
  }

  public onFocus(): void {
    if(this.scrollbox) {
      this.scrollbox.nativeElement.scrollTop = this.scrollbox.nativeElement.scrollHeight;
    }
  }

  public setActiveDialog(dialog: IDialog | null) {
    if(dialog?.companion) {
      this.store.dispatch(new ChatActions.SetRecepient(dialog.companion));
      this.store.dispatch(new ChatActions.RequestMessages(dialog.companion));
    } else {
      this.store.dispatch(new ChatActions.RequestDialogs());
      this.store.dispatch(new ChatActions.SetRecepient(null));
    }
  }
}
