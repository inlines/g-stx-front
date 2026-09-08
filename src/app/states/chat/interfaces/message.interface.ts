export interface IMessage {
  sender: string;
  recipient: string;
  body: string;
  created_at?: string;
}

export function isMessage(value: unknown): value is IMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return (
    typeof message['sender'] === 'string' &&
    typeof message['recipient'] === 'string' &&
    typeof message['body'] === 'string' &&
    (message['created_at'] === undefined || typeof message['created_at'] === 'string')
  );
}
