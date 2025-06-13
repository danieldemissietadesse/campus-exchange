// src/lib/listings.js
import { apiGet, apiSend } from './api';

export async function getListings({ q = '', category = 'All', pageSize = 20, cursor } = {}) {
  const p = new URLSearchParams({ q, category, pageSize });
  if (cursor) p.append('cursor', cursor);
  return apiGet(`/api/listings?${p.toString()}`);           // { listings, nextCursor }
}

export async function createListing(dataObj, imageFiles = []) {
  const fd = new FormData();
  Object.entries(dataObj).forEach(([k, v]) => fd.append(k, v));
  imageFiles.forEach(f => fd.append('images', f));
  return apiSend('POST', '/api/listings', fd, true);        // created listing JSON
}

export async function deleteListing(id) {
  return apiSend('DELETE', `/api/listings/${id}`);
}

export function streamListings(onUpdate) {
  const es = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/stream`);
  es.onmessage = e => onUpdate(JSON.parse(e.data));         // full array on each push
  return () => es.close();
}
