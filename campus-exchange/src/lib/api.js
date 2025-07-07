// src/lib/api.js - HYBRID VERSION WITH SSE + POLLING FALLBACK
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

/**  HYBRID: SSE with polling fallback for reliable message delivery */
export function streamMessages(userId, onData) {
  console.log('🚀 Starting hybrid message stream for user:', userId);
  
  let eventSource = null;
  let pollingInterval = null;
  let lastMessageCount = 0;
  let sseConnected = false;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  const reconnectDelay = 2000;
  const pollingInterval_ms = 5000; // Poll every 5 seconds as fallback
  
  // Polling fallback function
  const pollMessages = async () => {
    try {
      console.log('🔄 Polling for messages...');
      const messages = await getMessages();
      
      if (messages.length !== lastMessageCount) {
        console.log(`📥 Polling detected ${messages.length} messages (was ${lastMessageCount})`);
        lastMessageCount = messages.length;
        onData(messages);
      }
    } catch (error) {
      console.error('❌ Polling error:', error);
    }
  };
  
  // Start polling as immediate fallback
  const startPolling = () => {
    if (pollingInterval) return; // Already polling
    console.log('🔄 Starting polling fallback');
    pollMessages(); // Initial poll
    pollingInterval = setInterval(pollMessages, pollingInterval_ms);
  };
  
  // Stop polling when SSE works
  const stopPolling = () => {
    if (pollingInterval) {
      console.log('⏹️ Stopping polling (SSE working)');
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };
  
  const connectSSE = async () => {
    try {
      const headers = await authHeaders();
      const authParams = new URLSearchParams();
      if (headers.Authorization) {
        authParams.append('auth', headers.Authorization.replace('Bearer ', ''));
      }
      
      const url = `${API}/messages/stream?userId=${userId}&${authParams.toString()}`;
      console.log('📡 Connecting to SSE:', url);
      
      eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log('✅ SSE connection opened for messages');
        sseConnected = true;
        reconnectAttempts = 0;
        stopPolling(); // Stop polling when SSE works
      };
      
      eventSource.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          
          if (parsed.type === 'messages') {
            console.log(`📥 SSE: Processing ${parsed.data.length} messages (trigger: ${parsed.trigger || 'unknown'})`);
            lastMessageCount = parsed.data.length;
            onData(parsed.data);
            sseConnected = true;
          } else if (parsed.type === 'heartbeat') {
            console.log('💓 SSE heartbeat received');
            sseConnected = true;
          } else if (parsed.type === 'error') {
            console.error('❌ SSE error message:', parsed.message);
          } else {
            // Handle direct message data (fallback)
            if (Array.isArray(parsed)) {
              console.log(`📥 SSE: Processing ${parsed.length} direct messages`);
              lastMessageCount = parsed.length;
              onData(parsed);
              sseConnected = true;
            }
          }
        } catch (err) {
          console.error("❌ SSE messages parse error:", err, evt.data);
        }
      };
      
      eventSource.onerror = (e) => {
        console.warn("⚠️ Messages SSE error:", e);
        sseConnected = false;
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 SSE connection closed');
          
          // Start polling immediately when SSE fails
          startPolling();
          
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`🔄 SSE reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
            
            setTimeout(() => {
              if (eventSource && eventSource.readyState === EventSource.CLOSED) {
                connectSSE();
              }
            }, reconnectDelay * reconnectAttempts);
          } else {
            console.log('❌ Max SSE reconnection attempts reached, relying on polling');
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to create SSE connection:', error);
      sseConnected = false;
      startPolling(); // Fallback to polling
    }
  };
  
  // Start with both SSE and polling
  connectSSE();
  startPolling(); // Start polling immediately as backup
  
  // Return cleanup function
  return () => {
    console.log('🔌 Closing message stream');
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    sseConnected = false;
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
  console.log('📤 Sending message via API:', msg);
  try {
    const result = await apiSend("POST", "/messages", msg);
    console.log('✅ Message sent successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending message:', error);
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

