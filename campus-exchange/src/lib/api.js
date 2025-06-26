// src/lib/api.js - COMPLETE UPDATED VERSION
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

/**  FIXED: Improved message streaming with proper error handling and reconnection */
export function streamMessages(userId, onData) {
  console.log('🚀 Starting message stream for user:', userId);
  
  // Add auth headers to SSE request
  const connectSSE = async () => {
    try {
      const headers = await authHeaders();
      const authParams = new URLSearchParams();
      if (headers.Authorization) {
        authParams.append('auth', headers.Authorization.replace('Bearer ', ''));
      }
      
      const url = `${API}/messages/stream?userId=${userId}&${authParams.toString()}`;
      console.log('📡 Connecting to SSE:', url);
      
      const es = new EventSource(url);
      
      es.onopen = () => {
        console.log('✅ SSE connection opened for messages');
      };
      
      es.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          console.log('📨 SSE message received:', parsed);
          
          if (parsed.type === 'messages') {
            console.log(`📥 Processing ${parsed.data.length} messages`);
            onData(parsed.data);
          } else if (parsed.type === 'heartbeat') {
            console.log('💓 SSE heartbeat received');
          } else if (parsed.type === 'error') {
            console.error('❌ SSE error message:', parsed.message);
          } else {
            // Handle direct message data (fallback)
            if (Array.isArray(parsed)) {
              console.log(`📥 Processing ${parsed.length} direct messages`);
              onData(parsed);
            }
          }
        } catch (err) {
          console.error("❌ SSE messages parse error:", err, evt.data);
        }
      };
      
      es.onerror = (e) => {
        console.warn("⚠️ Messages SSE error:", e);
        // Don't immediately reconnect on error - let browser handle it
        if (es.readyState === EventSource.CLOSED) {
          console.log('🔄 SSE connection closed, will reconnect...');
        }
      };
      
      return es;
    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      return null;
    }
  };
  
  // Start the connection
  let eventSource = null;
  connectSSE().then(es => {
    eventSource = es;
  });
  
  // Return cleanup function
  return () => {
    console.log('🔌 Closing SSE connection for messages');
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
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
  console.log('Sending message via API:', msg);
  try {
    const result = await apiSend("POST", "/messages", msg);
    console.log('Message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function markMessageAsRead(id) {
  return apiSend("PATCH", `/messages/${id}/read`);
}

export async function getMessages() {
  return apiGet("/messages");
}

/* ----------  NEW: Conversation Management ---------- */
export async function getConversation(listingId, otherUserId) {
  return apiGet(`/messages/conversations/${listingId}?otherUserId=${otherUserId}`);
}

/* ----------  Enhanced Error Handling ---------- */
export async function testConnection() {
  try {
    const response = await fetch(`${API}/health`);
    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}