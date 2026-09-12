import { ToastService } from '@app/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { IDialog } from '../interfaces/dialog.interface';
import { IMessage, isMessage } from '../interfaces/message.interface';

export interface UnreadSnapshot {
  revision: number;
  unread: Record<string, number>;
}
export type ChatEvent =
  | ({ type: 'unread' } & UnreadSnapshot)
  | { type: 'read'; reader: string; ids: number[]; read_at: string }
  | { type: 'send_failed'; client_id: string | null };
function isUnread(value: any): value is UnreadSnapshot {
  return (
    Number.isSafeInteger(value?.revision) &&
    value.revision >= 0 &&
    value.unread &&
    typeof value.unread === 'object' &&
    !Array.isArray(value.unread) &&
    Object.values(value.unread).every((count) => Number.isSafeInteger(count) && Number(count) >= 0)
  );
}
@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly toast = inject(ToastService);
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
  private readonly controls = new Subject<ChatEvent>();
  readonly events$ = this.controls.asObservable();
  private readonly typing = new BehaviorSubject<ReadonlySet<string>>(new Set());
  readonly typing$ = this.typing.asObservable();
  private readonly typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
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
            for (const sender of this.typing.value)
              if (!message.online.includes(sender)) this.updateTyping(sender, false);
          }
        } else if (
          message &&
          typeof message === 'object' &&
          'type' in message &&
          message.type === 'new_request'
        ) {
          if (
            'request_id' in message &&
            Number.isSafeInteger(message.request_id) &&
            Number(message.request_id) > 0 &&
            'kind' in message &&
            (message.kind === 'serial' || message.kind === 'alternative_name')
          ) {
            this.toast.show({
              header: 'Новая заявка',
              body:
                message.kind === 'serial'
                  ? 'Пользователь предложил серийник релиза.'
                  : 'Пользователь предложил альтернативное название игры.',
              delay: 10000,
              route: '/profile',
              queryParams: { tab: 'admin', section: 'requests' },
              actionLabel: 'Рассмотреть заявки',
            });
            try {
              void new Audio('/audio/message.mp3').play().catch(() => {});
            } catch {
              /* Audio may be unavailable. */
            }
          }
        } else if (message && typeof message === 'object' && 'type' in message) {
          const frame = message as any;
          if (frame.type === 'unread' && isUnread(frame)) this.controls.next({ ...frame, type: 'unread' });
          else if (
            frame.type === 'read' &&
            typeof frame.reader === 'string' &&
            Array.isArray(frame.ids) &&
            frame.ids.every((id: unknown) => Number.isSafeInteger(id) && Number(id) > 0) &&
            typeof frame.read_at === 'string' &&
            Number.isFinite(Date.parse(frame.read_at))
          )
            this.controls.next(frame);
          else if (
            frame.type === 'send_failed' &&
            (frame.client_id === null || typeof frame.client_id === 'string')
          )
            this.controls.next(frame);
          else if (
            frame.type === 'typing' &&
            typeof frame.sender === 'string' &&
            typeof frame.typing === 'boolean'
          )
            this.updateTyping(frame.sender, frame.typing);
        } else if (isMessage(message)) {
          this.updateTyping(message.sender, false);
          this.incoming.next(message);
        }
      } catch {
        /* Ignore malformed frames; retain the connection for valid messages. */
      }
    };
    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      clearTimeout(this.authenticationTimer);
      this.socket = null;
      this.online.next(new Set());
      this.clearTyping();
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
    const message: IMessage = {
      ...payload,
      client_id:
        payload.client_id ??
        Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join(''),
      status: 'sending',
      created_at: new Date().toISOString(),
    };
    try {
      this.socket.send(
        JSON.stringify({ recipient: payload.recipient, body: payload.body, client_id: message.client_id }),
      );
      return message;
    } catch {
      return null;
    }
  }

  readMessages(ids: number[]): void {
    if (ids.length) this.sendControl({ type: 'read', ids: ids.slice(0, 100) });
  }
  sendTyping(recipient: string, typing: boolean): void {
    this.sendControl({ type: 'typing', recipient, typing });
  }
  private sendControl(frame: object): void {
    if (this.connection.value && this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(frame));
      } catch {}
    }
  }
  private updateTyping(sender: string, active: boolean): void {
    clearTimeout(this.typingTimers.get(sender));
    this.typingTimers.delete(sender);
    const next = new Set(this.typing.value);
    if (active) {
      next.add(sender);
      this.typingTimers.set(
        sender,
        setTimeout(() => this.updateTyping(sender, false), 4500),
      );
    } else next.delete(sender);
    this.typing.next(next);
  }
  private clearTyping(): void {
    this.typingTimers.forEach(clearTimeout);
    this.typingTimers.clear();
    this.typing.next(new Set());
  }
  requestUnread(): Observable<UnreadSnapshot> {
    return this.http.get<UnreadSnapshot>(`${this.environment.apiUrl}/chat/unread`);
  }
  closeConnection(): void {
    this.clearTyping();
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
