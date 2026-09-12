import { IDialog } from '../interfaces/dialog.interface';
import { IMessage } from '../interfaces/message.interface';

// Keep messages received while HTTP history was loading. Without timestamps,
// identical text may represent separate messages and must not be deduplicated.
export function mergeMessages(history: readonly IMessage[], incoming: readonly IMessage[]): IMessage[] {
  const result: IMessage[] = [];
  for (const message of [...history, ...incoming]) {
    const index = result.findIndex(
      (saved) =>
        (saved.id !== undefined && message.id !== undefined && saved.id === message.id) ||
        (!!saved.client_id && saved.client_id === message.client_id) ||
        (saved.id === undefined &&
          message.id === undefined &&
          saved.sender === message.sender &&
          saved.recipient === message.recipient &&
          saved.body === message.body &&
          !!saved.created_at &&
          !!message.created_at &&
          new Date(saved.created_at).getTime() === new Date(message.created_at).getTime()),
    );
    if (index < 0) result.push(message);
    else {
      const previous = result[index];
      const confirmed =
        message.id !== undefined
          ? message
          : previous.id !== undefined
            ? previous
            : message.client_id
              ? message
              : previous;
      result[index] = { ...previous, ...confirmed };
      if (previous.read || message.read)
        result[index] = { ...result[index], read: true, read_at: message.read_at ?? previous.read_at };
      if (result[index].id) delete result[index].status;
    }
  }
  return result.sort((a, b) => (a.id && b.id ? a.id - b.id : 0));
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
