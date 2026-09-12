import { ToastService } from '@app/services/toast.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { ChatService } from '@app/states/chat/services/chat.service';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { ChatState } from '@app/states/chat/states/chat.state';
import { ChatComponent } from './chat.component';

const incoming = { sender: 'alice', recipient: 'me', body: 'Hello', created_at: '2026-09-09T12:00:00Z' };
describe('Chat incoming notifications', () => {
  let store: Store;
  let fixture: ComponentFixture<ChatComponent>;
  let play: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    TestBed.configureTestingModule({ imports: [ChatComponent], providers: TEST_PROVIDERS });
    vi.spyOn(TestBed.inject(ChatService), 'connect').mockImplementation(() => {});
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    store = TestBed.inject(Store);
    const state = store.snapshot();
    store.reset({ ...state, Auth: { ...state.Auth, login: 'me' }, chat: { ...state.chat, login: 'me' } });
    fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture.destroy();
    TestBed.inject(ChatState).ngOnDestroy();
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });
  function opened(recipient: string | null) {
    const state = store.snapshot();
    store.reset({ ...state, chat: { ...state.chat, isOpened: true, recepient: recipient } });
    fixture.detectChanges();
  }
  it('opens a closed sidebar, sounds and highlights the incoming dialog', async () => {
    store.dispatch(new ChatActions.SetMessages([incoming]));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(store.selectSnapshot(ChatState.visible)).toBe(true);
    expect(play).toHaveBeenCalledOnce();
    expect(store.selectSnapshot(ChatState.recepient)).toBeNull();
    const row = fixture.nativeElement.querySelector('.dialog-item');
    expect(row.textContent).toContain('alice');
    expect(row.classList.contains('unread')).toBe(true);
    expect(row.classList.contains('highlight')).toBe(true);
  });
  it('scrolls and highlights an active dialog message without sound', async () => {
    opened('alice');
    const box = fixture.nativeElement.querySelector('.messages-wrapper');
    Object.defineProperty(box, 'scrollHeight', { value: 900 });
    store.dispatch(new ChatActions.SetMessages([incoming]));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(play).not.toHaveBeenCalled();
    expect(box.scrollTop).toBe(900);
    expect(fixture.nativeElement.querySelector('.message-item').classList.contains('highlight')).toBe(true);
  });
  it('notifies about another dialog without mixing messages or changing the active conversation', async () => {
    opened('bob');
    store.dispatch(new ChatActions.SetMessages([incoming]));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(play).toHaveBeenCalledOnce();
    expect(store.selectSnapshot(ChatState.recepient)).toBe('bob');
    expect(store.selectSnapshot(ChatState.messages)).toEqual([]);
    const notice = fixture.nativeElement.querySelector('.incoming-dialogs button');
    expect(notice.textContent).toContain('Новое от alice');
    expect(notice.classList.contains('highlight')).toBe(true);
    notice.click();
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url === '/api/messages')
      .flush([incoming]);
    fixture.detectChanges();
    expect(store.selectSnapshot(ChatState.recepient)).toBe('alice');
    expect(store.selectSnapshot(ChatState.unread)['alice']).toBe(1);
  });
  it('keeps messages received while history is loading and ignores self/foreign echoes', () => {
    opened('alice');
    store.dispatch(new ChatActions.RequestMessages('alice'));
    store.dispatch(new ChatActions.SetMessages([incoming]));
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url === '/api/messages')
      .flush([]);
    expect(store.selectSnapshot(ChatState.messages)).toEqual([incoming]);
    store.dispatch(
      new ChatActions.SetMessages([
        { ...incoming, sender: 'me' },
        { ...incoming, recipient: 'other' },
      ]),
    );
    expect(store.selectSnapshot(ChatState.messages)).toEqual([incoming]);
    expect(play).not.toHaveBeenCalled();
  });
  it('ignores history and dialog responses from a previous login', () => {
    opened('alice');
    store.dispatch(new ChatActions.RequestMessages('alice'));
    store.dispatch(new ChatActions.RequestDialogs());
    const http = TestBed.inject(HttpTestingController);
    const history = http.expectOne((r) => r.url === '/api/messages');
    const dialogs = http.expectOne((r) => r.url === '/api/dialogs');
    store.dispatch(new ChatActions.Reset());
    history.flush([incoming]);
    dialogs.flush([
      { companion: 'alice', last_message: 'Previous session', last_message_time: new Date().toISOString() },
    ]);
    expect(store.selectSnapshot(ChatState.messages)).toEqual([]);
    expect(store.selectSnapshot(ChatState.dialogs)).toEqual([]);
  });
  it('does not mark messages read just by selecting a dialog', () => {
    store.dispatch(
      new ChatActions.SetMessages([
        { sender: 'alice', recipient: 'me', body: 'One' },
        { sender: 'alice', recipient: 'me', body: 'Two' },
        { sender: 'bob', recipient: 'me', body: 'Three' },
      ]),
    );
    expect(store.selectSnapshot(ChatState.unreadCount)).toBe(3);
    store.dispatch(new ChatActions.SetRecepient('alice'));
    expect(store.selectSnapshot(ChatState.unreadCount)).toBe(3);
    store.dispatch(new ChatActions.SetRecepient('bob'));
    expect(store.selectSnapshot(ChatState.unreadCount)).toBe(3);
  });
  function subscribeState() {
    TestBed.inject(ChatState).ngxsAfterBootstrap({
      getState: () => store.snapshot().chat,
      patchState: (patch: any) => {
        const snapshot = store.snapshot();
        store.reset({ ...snapshot, chat: { ...snapshot.chat, ...patch } });
      },
      setState: (value: any) => {
        store.reset({ ...store.snapshot(), chat: value });
        return value;
      },
      dispatch: (action: any) => store.dispatch(action),
    } as any);
  }
  it('uses versioned server counts, does not double-count delivery, and applies read receipts', () => {
    subscribeState();
    const service = TestBed.inject(ChatService) as any;
    service.controls.next({ type: 'unread', revision: 2, unread: { alice: 2, bob: 1 } });
    expect(store.selectSnapshot(ChatState.unreadCount)).toBe(3);
    service.controls.next({ type: 'unread', revision: 1, unread: { alice: 99 } });
    expect(store.selectSnapshot(ChatState.unreadCount)).toBe(3);
    opened('alice');
    store.dispatch(new ChatActions.SetMessages([{ ...incoming, id: 1 }]));
    store.dispatch(new ChatActions.SetMessages([{ ...incoming, id: 1 }]));
    expect(store.selectSnapshot(ChatState.messages)).toHaveLength(1);
    expect(store.selectSnapshot(ChatState.unreadCount)).toBe(3);
    service.controls.next({ type: 'read', reader: 'me', ids: [1], read_at: '2026-09-12T10:00:00Z' });
    expect(store.selectSnapshot(ChatState.messages)[0].read).toBe(true);
    service.controls.next({ type: 'unread', revision: 3, unread: { bob: 1 } });
    expect(store.selectSnapshot(ChatState.unreadCount)).toBe(1);
  });
  it('restores unread counts and notifies only once after authentication', () => {
    subscribeState();
    const service = TestBed.inject(ChatService) as any;
    const http = TestBed.inject(HttpTestingController);
    const show = vi.spyOn(TestBed.inject(ToastService), 'show');
    service.connection.next(true);
    http.expectOne('/api/dialogs').flush([]);
    http.expectOne('/api/chat/unread').flush({ revision: 5, unread: { alice: 4 } });
    expect(store.selectSnapshot(ChatState.unreadCount)).toBe(4);
    expect(show).toHaveBeenCalledOnce();
    expect(show.mock.calls[0][0].body).toContain('4');
    service.connection.next(false);
    service.connection.next(true);
    http.expectOne('/api/dialogs').flush([]);
    http.expectOne('/api/chat/unread').flush({ revision: 5, unread: { alice: 4 } });
    expect(show).toHaveBeenCalledOnce();
  });
  it('marks only visible incoming messages, never when the document is hidden or covered', () => {
    opened('alice');
    const state = store.snapshot();
    store.reset({
      ...state,
      chat: {
        ...state.chat,
        isConnected: true,
        messages: [
          { ...incoming, id: 1, read: false },
          { ...incoming, id: 2, read: false },
        ],
      },
    });
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('.messages-wrapper');
    const rows = fixture.nativeElement.querySelectorAll('.message-item');
    const rect = (top: number, bottom: number) => ({
      top,
      bottom,
      left: 0,
      right: 300,
      height: bottom - top,
      width: 300,
    });
    vi.spyOn(box, 'getBoundingClientRect').mockReturnValue(rect(100, 300));
    vi.spyOn(rows[0], 'getBoundingClientRect').mockReturnValue(rect(120, 180));
    vi.spyOn(rows[1], 'getBoundingClientRect').mockReturnValue(rect(400, 460));
    if (!document.elementFromPoint)
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        writable: true,
        value: () => null,
      });
    const top = vi.spyOn(document, 'elementFromPoint').mockReturnValue(rows[0]);
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    const read = vi.spyOn(TestBed.inject(ChatService), 'readMessages');
    fixture.componentInstance.markVisibleRead();
    expect(read).not.toHaveBeenCalled();
    visibility.mockReturnValue('visible');
    top.mockReturnValue(document.body);
    fixture.componentInstance.markVisibleRead();
    expect(read).toHaveBeenLastCalledWith([]);
    top.mockReturnValue(rows[0]);
    fixture.componentInstance.markVisibleRead();
    expect(read).toHaveBeenLastCalledWith([1]);
  });
  it('stops typing when leaving the conversation and sends no draft text', () => {
    opened('alice');
    const typing = vi.spyOn(TestBed.inject(ChatService), 'sendTyping');
    fixture.componentInstance.message = 'draft';
    fixture.componentInstance.onDraftChange();
    expect(typing).toHaveBeenCalledWith('alice', true);
    store.dispatch(new ChatActions.SetRecepient('bob'));
    fixture.detectChanges();
    expect(typing).toHaveBeenCalledWith('alice', false);
  });
});
