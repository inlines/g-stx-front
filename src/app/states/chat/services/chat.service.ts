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
  private token: string | null = null;
  private authenticationTimer?: ReturnType<typeof setTimeout>;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private retryDelay = 1000;
  private readonly connection = new BehaviorSubject(false);
  private readonly incoming = new Subject<IMessage>();
  private readonly online = new BehaviorSubject<ReadonlySet<string>>(new Set());
  readonly online$ = this.online.asObservable();
  readonly connected$ = this.connection.asObservable();
  readonly messages$ = this.incoming.asObservable();

  connect(login: string, token: string): void {
    if (!login || !token) {
      this.closeConnection();
      return;
    }
    if (
      login === this.login &&
      token === this.token &&
      this.socket &&
      this.socket.readyState < WebSocket.CLOSING
    )
      return;
    this.closeConnection();
    this.login = login;
    this.token = token;
    this.openSocket();
  }

  private openSocket(): void {
    if (!this.login || !this.token) return;
    const url = new URL(this.environment.wsUrl, window.location.href);
    if (url.protocol === 'https:') url.protocol = 'wss:';
    if (url.protocol === 'http:') url.protocol = 'ws:';
    const socket = new WebSocket(url);
    this.socket = socket;
    socket.onopen = () => {
      if (this.socket !== socket) return;
      socket.send(JSON.stringify({ type: 'authenticate', token: this.token }));
      this.authenticationTimer = setTimeout(() => socket.close(), 7000);
    };
    socket.onmessage = (event) => {
      if (this.socket !== socket) return;
      try {
        const message: unknown = JSON.parse(event.data);
        if (message && typeof message === 'object' && 'type' in message && message.type === 'authenticated') {
          if (!('login' in message) || message.login !== this.login) {
            socket.close(1008);
            return;
          }
          clearTimeout(this.authenticationTimer);
          this.retryDelay = 1000;
          this.connection.next(true);
        } else if (!this.connection.value) {
          return;
        } else if (
          message &&
          typeof message === 'object' &&
          'type' in message &&
          message.type === 'presence'
        ) {
          if (
            'online' in message &&
            Array.isArray(message.online) &&
            message.online.every((login) => typeof login === 'string')
          ) {
            this.online.next(new Set(message.online));
          }
        } else if (isMessage(message)) this.incoming.next(message);
      } catch {
        /* Ignore malformed frames; retain the connection for valid messages. */
      }
    };
    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      clearTimeout(this.authenticationTimer);
      this.socket = null;
      this.online.next(new Set());
      this.connection.next(false);
      if (this.login && event.code !== 1008) {
        this.reconnectTimer = setTimeout(() => this.openSocket(), this.retryDelay);
        this.retryDelay = Math.min(this.retryDelay * 2, 10000);
      }
    };
    socket.onerror = () => {
      if (this.socket === socket) {
        this.online.next(new Set());
        this.connection.next(false);
      }
    };
  }

  sendMessage(payload: IMessage): IMessage | null {
    if (!this.connection.value || this.socket?.readyState !== WebSocket.OPEN || !payload.body.trim())
      return null;
    const message = { ...payload, created_at: new Date().toISOString() };
    try {
      this.socket.send(JSON.stringify({ recipient: payload.recipient, body: payload.body }));
      return message;
    } catch {
      return null;
    }
  }

  closeConnection(): void {
    this.login = null;
    this.token = null;
    clearTimeout(this.authenticationTimer);
    this.online.next(new Set());
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
