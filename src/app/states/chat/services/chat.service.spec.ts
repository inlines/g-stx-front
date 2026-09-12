import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { ToastService } from '@app/services/toast.service';
import { ChatService } from './chat.service';

class Socket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: Socket[] = [];
  readyState = 0;
  onopen?: () => void;
  onclose?: (event: { code: number }) => void;
  onerror?: () => void;
  onmessage?: (event: { data: string }) => void;
  send = vi.fn();
  constructor(readonly url: URL) {
    Socket.instances.push(this);
  }
  close(code = 1000) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
    this.onmessage?.({ data: JSON.stringify({ type: 'authenticated', login: 'alice' }) });
  }
}

describe('Chat socket lifecycle and existing wire format', () => {
  let service: ChatService;
  beforeEach(() => {
    vi.useFakeTimers();
    Socket.instances = [];
    vi.stubGlobal('WebSocket', Socket);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: { apiUrl: '/api', wsUrl: '/ws/' } },
      ],
    });
    service = TestBed.inject(ChatService);
  });
  afterEach(() => {
    service.closeConnection();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it('does not open duplicate connections while connecting or connected', () => {
    service.connect('alice', 'valid-token');
    service.connect('alice', 'valid-token');
    expect(Socket.instances).toHaveLength(1);
    Socket.instances[0].open();
    service.connect('alice', 'valid-token');
    expect(Socket.instances).toHaveLength(1);
    expect(Socket.instances[0].url.pathname).toBe('/ws/');
  });
  it('reconnects once after a disconnect and cancels reconnect on logout', () => {
    service.connect('alice', 'valid-token');
    Socket.instances[0].open();
    Socket.instances[0].close();
    vi.advanceTimersByTime(1000);
    expect(Socket.instances).toHaveLength(2);
    Socket.instances[1].close();
    service.closeConnection();
    vi.advanceTimersByTime(20000);
    expect(Socket.instances).toHaveLength(2);
  });
  it('ignores malformed frames and keeps the socket usable', () => {
    const received = vi.fn();
    service.messages$.subscribe(received);
    service.connect('alice', 'valid-token');
    const socket = Socket.instances[0];
    socket.open();
    socket.onmessage?.({ data: 'invalid json' });
    socket.onmessage?.({ data: '{}' });
    const message = { sender: 'bob', recipient: 'alice', body: 'Hello', created_at: '2026-09-08T00:00:00Z' };
    socket.onmessage?.({ data: JSON.stringify(message) });
    expect(received).toHaveBeenCalledExactlyOnceWith(message);
  });
  it('preserves the API payload and refuses optimistic send while disconnected', () => {
    const payload = { sender: 'alice', recipient: 'bob', body: 'Hello' };
    expect(service.sendMessage(payload)).toBeNull();
    service.connect('alice', 'valid-token');
    const socket = Socket.instances[0];
    socket.open();
    const message = service.sendMessage(payload);
    expect(message).toEqual({
      ...payload,
      created_at: expect.any(String),
      client_id: expect.any(String),
      status: 'sending',
    });
    expect(JSON.parse(socket.send.mock.calls.at(-1)![0])).toEqual({
      recipient: 'bob',
      body: 'Hello',
      client_id: message!.client_id,
    });
  });
  it('updates presence independently from messages and clears it on disconnect', () => {
    const online = vi.fn();
    const messages = vi.fn();
    service.online$.subscribe(online);
    service.messages$.subscribe(messages);
    service.connect('alice', 'valid-token');
    const socket = Socket.instances[0];
    socket.open();
    socket.onmessage?.({ data: JSON.stringify({ type: 'presence', online: ['alice', 'bob'] }) });
    expect(online).toHaveBeenLastCalledWith(new Set(['alice', 'bob']));
    expect(messages).not.toHaveBeenCalled();
    socket.onmessage?.({ data: JSON.stringify({ type: 'presence', online: [12] }) });
    expect(online).toHaveBeenLastCalledWith(new Set(['alice', 'bob']));
    socket.onmessage?.({ data: JSON.stringify({ type: 'presence', online: ['alice'] }) });
    expect(online).toHaveBeenLastCalledWith(new Set(['alice']));
    socket.close();
    expect(online).toHaveBeenLastCalledWith(new Set());
  });
  it('authenticates before announcing connection or allowing messages, without URL credentials', () => {
    const connected = vi.fn();
    service.connected$.subscribe(connected);
    service.connect('alice', 'secret-token');
    const socket = Socket.instances[0];
    socket.readyState = 1;
    socket.onopen?.();
    expect(socket.url.pathname).toBe('/ws/');
    expect(socket.url.search).toBe('');
    expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({ type: 'authenticate', token: 'secret-token' });
    expect(connected).toHaveBeenLastCalledWith(false);
    expect(service.sendMessage({ sender: 'alice', recipient: 'bob', body: 'Wait' })).toBeNull();
    socket.onmessage?.({ data: JSON.stringify({ type: 'authenticated', login: 'alice' }) });
    expect(connected).toHaveBeenLastCalledWith(true);
    socket.close(1008);
    vi.advanceTimersByTime(10000);
    expect(Socket.instances).toHaveLength(1);
  });
  it('notifies about requests only after authentication without emitting a chat message', async () => {
    const play = vi.fn().mockRejectedValue(new Error('autoplay blocked'));
    vi.stubGlobal(
      'Audio',
      class {
        play = play;
      },
    );
    const messages = vi.fn();
    service.messages$.subscribe(messages);
    service.connect('alice', 'token');
    const socket = Socket.instances[0];
    const emit = (kind: string, request_id = 1) =>
      socket.onmessage?.({ data: JSON.stringify({ type: 'new_request', kind, request_id }) });
    emit('serial');
    expect(TestBed.inject(ToastService).toasts).toHaveLength(0);
    socket.open();
    emit('serial');
    emit('alternative_name', 2);
    emit('unknown');
    emit('serial', -1);
    await Promise.resolve();
    expect(TestBed.inject(ToastService).toasts).toHaveLength(2);
    expect(TestBed.inject(ToastService).toasts[1]).toMatchObject({
      queryParams: { tab: 'admin', section: 'requests' },
      body: expect.stringContaining('название'),
    });
    expect(play).toHaveBeenCalledTimes(2);
    expect(messages).not.toHaveBeenCalled();
  });
  it('does not open an anonymous connection', () => {
    service.connect('alice', '');
    expect(Socket.instances).toHaveLength(0);
  });
  it('expires typing without a stop frame and clears it when the user goes offline', () => {
    const typing = vi.fn();
    service.typing$.subscribe(typing);
    service.connect('alice', 'valid-token');
    const socket = Socket.instances[0];
    socket.open();
    socket.onmessage?.({ data: JSON.stringify({ type: 'typing', sender: 'bob', typing: true }) });
    expect(typing).toHaveBeenLastCalledWith(new Set(['bob']));
    vi.advanceTimersByTime(4501);
    expect(typing).toHaveBeenLastCalledWith(new Set());
    socket.onmessage?.({ data: JSON.stringify({ type: 'typing', sender: 'bob', typing: true }) });
    socket.onmessage?.({ data: JSON.stringify({ type: 'presence', online: ['alice'] }) });
    expect(typing).toHaveBeenLastCalledWith(new Set());
  });
  it('accepts validated control events separately and sends recipient-bound reads and typing', () => {
    const events = vi.fn();
    service.events$.subscribe(events);
    service.connect('alice', 'valid-token');
    const socket = Socket.instances[0];
    socket.open();
    socket.onmessage?.({ data: JSON.stringify({ type: 'unread', revision: 2, unread: { bob: 3 } }) });
    expect(events).toHaveBeenCalledOnce();
    socket.onmessage?.({ data: JSON.stringify({ type: 'unread', revision: 1, unread: { bob: -1 } }) });
    expect(events).toHaveBeenCalledOnce();
    service.readMessages([5, 6]);
    expect(JSON.parse(socket.send.mock.calls.at(-1)![0])).toEqual({ type: 'read', ids: [5, 6] });
    service.sendTyping('bob', true);
    expect(JSON.parse(socket.send.mock.calls.at(-1)![0])).toEqual({
      type: 'typing',
      recipient: 'bob',
      typing: true,
    });
  });
});
