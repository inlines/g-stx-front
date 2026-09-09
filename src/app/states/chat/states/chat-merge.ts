import { IDialog } from '../interfaces/dialog.interface';
import { IMessage } from '../interfaces/message.interface';

// Keep messages received while HTTP history was loading. Without timestamps,
// identical text may represent separate messages and must not be deduplicated.
export function mergeMessages(history: readonly IMessage[], incoming: readonly IMessage[]): IMessage[] {
  return [
    ...history,
    ...incoming.filter(
      (message) =>
        !history.some(
          (saved) =>
            saved.sender === message.sender &&
            saved.recipient === message.recipient &&
            saved.body === message.body &&
            !!saved.created_at &&
            !!message.created_at &&
            new Date(saved.created_at).getTime() === new Date(message.created_at).getTime(),
        ),
    ),
  ];
}

// A delayed HTTP response must not replace a newer local dialog preview.
// The server wins when timestamps match, as before.
export function mergeDialogs(remote: readonly IDialog[], local: readonly IDialog[]): IDialog[] {
  return [
    ...remote.filter(
      (item) =>
        !local.some(
          (current) =>
            current.companion === item.companion &&
            new Date(current.last_message_time) > new Date(item.last_message_time),
        ),
    ),
    ...local.filter(
      (item) =>
        !remote.some(
          (saved) =>
            saved.companion === item.companion &&
            new Date(saved.last_message_time) >= new Date(item.last_message_time),
        ),
    ),
  ];
}
