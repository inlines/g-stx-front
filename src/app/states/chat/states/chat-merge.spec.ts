import { mergeDialogs, mergeMessages } from './chat-merge';
import { IMessage } from '../interfaces/message.interface';

const message: IMessage = {
  sender: 'alice',
  recipient: 'bob',
  body: 'Hello',
  created_at: '2026-09-09T10:00:00Z',
};
const dialog = (companion: string, time: string, text = 'Hello') => ({
  companion,
  last_message_time: time,
  last_message: text,
});

describe('Chat history merge', () => {
  it('keeps messages received during loading, without mutating either source', () => {
    const history = Object.freeze([Object.freeze(message)]);
    const next = { ...message, body: 'New', created_at: '2026-09-09T10:01:00Z' };
    const incoming = Object.freeze([next]);
    expect(mergeMessages(history, incoming)).toEqual([message, next]);
    expect(history).toEqual([message]);
    expect(incoming).toEqual([next]);
  });
  it('recognizes the same message with differently formatted timestamps', () => {
    expect(mergeMessages([message], [{ ...message, created_at: '2026-09-09T13:00:00+03:00' }])).toEqual([
      message,
    ]);
  });
  it.each([
    { created_at: undefined },
    { created_at: 'invalid' },
    { created_at: '2026-09-09T10:00:01Z' },
    { sender: 'charlie' },
    { recipient: 'charlie' },
    { body: 'Different' },
  ])('preserves distinct or unidentifiable incoming messages: %j', (change) => {
    const incoming = { ...message, ...change };
    expect(mergeMessages([message], [incoming])).toEqual([message, incoming]);
  });
  it('keeps repeated text when neither message has a timestamp', () => {
    const untimed = { ...message, created_at: undefined };
    expect(mergeMessages([untimed], [untimed])).toEqual([untimed, untimed]);
  });
  it('retains newer local previews and dialogs absent from the response', () => {
    const old = dialog('alice', '2026-09-09T10:00:00Z');
    const newer = dialog('alice', '2026-09-09T10:01:00Z', 'New');
    const localOnly = dialog('bob', old.last_message_time);
    const remoteOnly = dialog('charlie', old.last_message_time);
    expect(mergeDialogs(Object.freeze([old, remoteOnly]), Object.freeze([newer, localOnly]))).toEqual([
      remoteOnly,
      newer,
      localOnly,
    ]);
  });
  it.each(['2026-09-09T10:00:00Z', '2026-09-09T10:01:00Z'])(
    'accepts server previews at equal or newer times: %s',
    (time) => {
      const local = dialog('alice', '2026-09-09T10:00:00Z');
      const remote = dialog('alice', time, 'Server');
      expect(mergeDialogs([remote], [local])).toEqual([remote]);
    },
  );
  it('keeps identical text with different persisted IDs and reconciles an optimistic message', () => {
    expect(mergeMessages([{ ...message, id: 1 }], [{ ...message, id: 2 }])).toHaveLength(2);
    const pending = { ...message, client_id: 'one', status: 'sending' as const };
    const confirmed = { ...message, client_id: 'one', id: 1, read: false };
    expect(mergeMessages([pending], [confirmed])).toEqual([confirmed]);
  });
  it('never loses a read receipt to a delayed history response or delivery echo', () => {
    const read = { ...message, id: 1, read: true, read_at: '2026-09-12T10:00:00Z' };
    const merged = mergeMessages([read], [{ ...message, id: 1, read: false, read_at: null }]);
    expect(merged[0].read).toBe(true);
    expect(merged[0].read_at).toBe(read.read_at);
  });
});
