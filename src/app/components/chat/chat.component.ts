// src/app/components/chat/chat.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Store, Select, Actions, ofActionCompleted } from '@ngxs/store';
import { filter, map, Observable, take, withLatestFrom } from 'rxjs';
import { ChatState } from '@app/states/chat/states/chat.state';
import { AuthState } from '@app/states/auth/states/auth.state';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { IDialog } from '@app/states/chat/interfaces/dialog.interface';
import { ToastService } from '@app/services/toast.service';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [FormsModule, AsyncPipe, NgFor, NgClass, NgIf, DatePipe],
})
export class ChatComponent implements OnInit, OnDestroy {
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
        } else {
            debugger;
            console.warn('notifff');
            this.toastService.clear();
            this.toastService.show({
              body: 'Вам пришло новое сообщение',
              classname: 'bg-success text-light',
              delay: 1500,
            });
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
    // this.chatService.closeConnection();
  }

  public isOpen = true;

  public closeChat() {
    this.store.dispatch(new ChatActions.ToggleChatVisibility());
  }

  public setActiveDialog(dialog: IDialog | null) {
    if(dialog?.companion) {
      this.store.dispatch(new ChatActions.SetRecepient(dialog.companion));
      this.store.dispatch(new ChatActions.RequestMessages(dialog.companion));
    } else {
      this.store.dispatch(new ChatActions.SetRecepient(null));
    }
  }
}
