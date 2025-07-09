// src/app/services/websocket.service.ts
import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { ChatActions } from '../states/chat-actions';
import { IMessage } from '../interfaces/message.interface';
import { IEnvironment } from '@app/environments/environment.interface';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { IDialog } from '../interfaces/dialog.interface';
import { ToastService } from '@app/services/toast.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: WebSocket | null = null;
  private wsUrl: string;
  private dialogsUrl: string;
  private messagesUrl: string;
  private isConnected: boolean = false; // Флаг для отслеживания состояния подключения
  private lastLogin!: string | null;

  public checkInterval: any;

  public connected$ = new BehaviorSubject(false);

  constructor(private toastService: ToastService, private store: Store, private http: HttpClient, @Inject('environment') private environment: IEnvironment,) {
    this.wsUrl = this.environment.wsUrl;
    this.dialogsUrl = `${this.environment.apiUrl}/dialogs`
    this.messagesUrl = `${this.environment.apiUrl}/messages`
  }

  // Метод для подключения к WebSocket
  connect(login: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket уже подключен');
      this.connected$.next(true);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsFullUrl = `${protocol}//${host}${this.wsUrl}${login}`;
    this.socket = new WebSocket(wsFullUrl);

    this.socket.onopen = () => {
      this.toastService.clear();
      this.toastService.show({
        body: 'Сокет подключен',
        classname: 'bg-success text-light',
        delay: 1500,
      });
      this.connected$.next(true);
      this.isConnected = true;
      this.lastLogin = login;
      this.store.dispatch(new ChatActions.RequestDialogs());
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
       console.log('Получено сообщение:', message);
      this.store.dispatch(new ChatActions.SetMessages([message]));
    };

    this.socket.onerror = (error) => {
      this.toastService.clear();
      this.toastService.show({
        body: 'Ошибка сокета',
        classname: 'bg-danger text-light',
        delay: 500,
      });
    };


    this.socket.onclose = () => {
      console.log('WebSocket closed');
      this.connected$.next(false);
      this.isConnected = false;
    };
  }

  doStateCheck(): void {
    this.checkInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.CLOSED || this.socket?.readyState === WebSocket.CLOSING) {
        this.connected$.next(false);
        console.warn('WebSocket неактивен, переподключение...');
        if(this.lastLogin) {
          this.connect(this.lastLogin);
        }
      }
    }, 1000);
  }

  sendMessage(payload: IMessage): void {
    if (!this.socket) {
      console.warn('WebSocket соединение не установлено!');
      return;
    }

    if (this.socket.readyState !== WebSocket.OPEN) {
      this.toastService.show({
        body: 'WebSocket не открыт для отправки сообщений',
        classname: 'bg-danger text-light',
        delay: 1500,
      });
      return;
    }

    console.log('Отправка сообщения через WebSocket...');
    const message = {
      ...payload,
      created_at: new Date().toISOString(),
    };
    console.warn(message);

    this.socket.send(JSON.stringify(message));
  }

  // Закрытие WebSocket соединения
  closeConnection(): void {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
      this.connected$.next(false);
      this.lastLogin = null;
    }
    clearInterval(this.checkInterval);
  }

  requestDialogs(): Observable<IDialog[]> {
    return this.http.get<IDialog[]>(this.dialogsUrl);
  }

  requestMessages(companion: string): Observable<IMessage[]> {
    return this.http.get<IMessage[]>(this.messagesUrl, {params: {companion}});
  }
}
