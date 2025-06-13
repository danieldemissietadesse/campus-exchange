// src/lib/messages.js
import { apiGet, apiSend } from './api';

export const getMessages       = ()        => apiGet('/api/messages');
export const sendMessage       = bodyObj   => apiSend('POST',  '/api/messages',           bodyObj);
export const markMessageAsRead = id        => apiSend('PATCH', `/api/messages/${id}/read`, {});
export const deleteConversation = (id)     => apiSend('DELETE', `/api/messages/${id}`);   // optional

export function streamMessages(onUpdate) {
  const es = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/messages/stream`);
  es.onmessage = e => onUpdate(JSON.parse(e.data));
  return () => es.close();
}
