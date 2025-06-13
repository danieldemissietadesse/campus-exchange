// src/lib/api.js
import { getAuth } from "firebase/auth";

/* ------------------------------------------------------------------
 * Base URL – override in .env.local if you wish
 * -----------------------------------------------------------------*/
export const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

/* ------------------------------------------------------------------
 * Little helper that adds the Firebase ID-token when we have one
 * -----------------------------------------------------------------*/
async function authHeaders() {
  const user = getAuth().currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

function jsonOk(res, verb, path) {
  if (!res.ok) throw new Error(`${verb} ${path} → ${res.status}`);
  return res.json();
}

/* ------------------------------------------------------------------
 * Generic REST helpers
 * -----------------------------------------------------------------*/
export async function apiGet(path) {
  const res = await fetch(`${API}${path}`, {
    headers: await authHeaders(),
  });
  return jsonOk(res, "GET", path);
}

export async function apiSend(method, path, body, form = false) {
  const headers = await authHeaders();
  if (!form) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: form ? body : JSON.stringify(body),
  });
  return jsonOk(res, method, path);
}

/* ==================================================================
 * BUSINESS HELPERS  ✨  –––––  these are what page.js imports
 * =================================================================*/

/* ----------  Server-Sent-Events streams ---------- */
export function streamListings(onData) {
  const es = new EventSource(`${API}/listings/stream`);
  es.onmessage = (evt) => {
    try {
      onData(JSON.parse(evt.data));
    } catch (err) {
      console.error("SSE listings parse error:", err);
    }
  };
  es.onerror = (e) => console.warn("listings SSE error", e);
  return () => es.close();
}

/**  Pass the current userId – the backend filters messages for you */
export function streamMessages(userId, onData) {
  const es = new EventSource(`${API}/messages/stream?userId=${userId}`);
  es.onmessage = (evt) => {
    try {
      onData(JSON.parse(evt.data));
    } catch (err) {
      console.error("SSE messages parse error:", err);
    }
  };
  es.onerror = (e) => console.warn("messages SSE error", e);
  return () => es.close();
}

/* ----------  Listings CRUD ---------- */
export async function createListing(listing) {
  // If the caller gives us File objects, switch to multipart/form-data
  const hasFiles = listing.images?.length;
  if (hasFiles) {
    const fd = new FormData();
    Object.entries(listing).forEach(([k, v]) => {
      if (k === "images") {
        v.forEach((file) => fd.append("images", file));
      } else {
        fd.append(k, v);
      }
    });
    return apiSend("POST", "/listings", fd, true);
  }
  return apiSend("POST", "/listings", listing);
}

export async function deleteListing(id) {
  return apiSend("DELETE", `/listings/${id}`);
}

/* ----------  Messaging ---------- */
export async function sendMessage(msg) {
  return apiSend("POST", "/messages", msg);
}

export async function markMessageAsRead(id) {
  return apiSend("PATCH", `/messages/${id}/read`);
}
