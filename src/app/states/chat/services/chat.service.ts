import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { IDialog } from '../interfaces/dialog.interface';
import { IMessage, isMessage } from '../interfaces/message.interface';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private socket: WebSocket | null = null;
  private login: string | null = null;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private retryDelay = 1000;
  private readonly connection = new BehaviorSubject(false);
  private readonly incoming = new Subject<IMessage>();
  readonly connected$ = this.connection.asObservable();
  readonly messages$ = this.incoming.asObservable();

  connect(login: string): void {
    if (!login) return;
    if (login === this.login && this.socket && this.socket.readyState < WebSocket.CLOSING) return;
    this.closeConnection();
    this.login = login;
    this.openSocket();
  }

  private openSocket(): void {
    if (!this.login) return;
    const url = new URL(`${this.environment.wsUrl}${encodeURIComponent(this.login)}`, window.location.href);
    if (url.protocol === 'https:') url.protocol = 'wss:';
    if (url.protocol === 'http:') url.protocol = 'ws:';
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.retryDelay = 1000;
      this.connection.next(true);
    };
    socket.onmessage = (event) => {
      if (this.socket !== socket) return;
      try {
        const message: unknown = JSON.parse(event.data);
        if (isMessage(message)) this.incoming.next(message);
      } catch {
        /* Ignore malformed frames; retain the connection for valid messages. */
      }
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.connection.next(false);
      if (this.login) {
        this.reconnectTimer = setTimeout(() => this.openSocket(), this.retryDelay);
        this.retryDelay = Math.min(this.retryDelay * 2, 10000);
      }
    };
    socket.onerror = () => {
      if (this.socket === socket) this.connection.next(false);
    };
  }

  sendMessage(payload: IMessage): IMessage | null {
    if (this.socket?.readyState !== WebSocket.OPEN || !payload.body.trim()) return null;
    const message = { ...payload, created_at: new Date().toISOString() };
    try {
      this.socket.send(JSON.stringify(message));
      return message;
    } catch {
      return null;
    }
  }

  closeConnection(): void {
    this.login = null;
    clearTimeout(this.reconnectTimer);
    const socket = this.socket;
    this.socket = null;
    socket?.close();
    this.connection.next(false);
    this.retryDelay = 1000;
  }

  requestDialogs(): Observable<IDialog[]> {
    return this.http.get<IDialog[]>(`${this.environment.apiUrl}/dialogs`);
  }
  requestMessages(companion: string): Observable<IMessage[]> {
    return this.http.get<IMessage[]>(`${this.environment.apiUrl}/messages`, { params: { companion } });
  }
  ngOnDestroy(): void {
    this.closeConnection();
  }
}
