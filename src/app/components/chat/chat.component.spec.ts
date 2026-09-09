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
    expect(store.selectSnapshot(ChatState.unread)['alice']).toBeUndefined();
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
});
