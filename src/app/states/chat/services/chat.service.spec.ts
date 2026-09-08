import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { ChatService } from './chat.service';

class Socket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: Socket[] = [];
  readyState = 0;
  onopen?: () => void;
  onclose?: () => void;
  onerror?: () => void;
  onmessage?: (event: { data: string }) => void;
  send = vi.fn();
  constructor(readonly url: URL) {
    Socket.instances.push(this);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
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
    service.connect('alice');
    service.connect('alice');
    expect(Socket.instances).toHaveLength(1);
    Socket.instances[0].open();
    service.connect('alice');
    expect(Socket.instances).toHaveLength(1);
    expect(Socket.instances[0].url.pathname).toBe('/ws/alice');
  });
  it('reconnects once after a disconnect and cancels reconnect on logout', () => {
    service.connect('alice');
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
    service.connect('alice');
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
    service.connect('alice');
    const socket = Socket.instances[0];
    socket.open();
    const message = service.sendMessage(payload);
    expect(message).toEqual({ ...payload, created_at: expect.any(String) });
    expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual(message);
  });
});
