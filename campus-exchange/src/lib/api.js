import { getAuth } from "firebase/auth";

export const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

// Helper to add the Firebase ID token to requests
async function authHeaders() {
  const user = getAuth().currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// Helper to handle API responses
async function handleResponse(res, verb, path) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Request failed' }));
    console.error(`${verb} ${path} → ${res.status}`, errorBody);
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// Generic API call functions
export async function apiGet(path) {
  const res = await fetch(`${API}${path}`, { headers: await authHeaders() });
  return handleResponse(res, "GET", path);
}

export async function apiSend(method, path, body, isFormData = false) {
  const headers = await authHeaders();
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: isFormData ? body : JSON.stringify(body),
  });
  return handleResponse(res, method, path);
}

/* ==================================================================
 * APPLICATION API HELPERS
 * =================================================================*/

/**
 * LISTINGS
 */
export async function createListing(listingData) {
  const hasFiles = listingData.images?.length > 0;
  if (hasFiles) {
    const fd = new FormData();
    Object.entries(listingData).forEach(([k, v]) => {
      if (k === "images") {
        v.forEach(file => fd.append("images", file));
      } else {
        fd.append(k, v);
      }
    });
    return apiSend("POST", "/listings", fd, true);
  }
  return apiSend("POST", "/listings", listingData);
}

export function streamListings(onData) {
  const es = new EventSource(`${API}/listings/stream`);
  es.onmessage = (evt) => {
    try {
      onData(JSON.parse(evt.data));
    } catch (err) {
      console.error("SSE listings parse error:", err);
    }
  };
  es.onerror = (e) => console.warn("Listings SSE error", e);
  return () => es.close();
}


/**
 * MESSAGING
 */
export function streamMessages(onNewMessage) {
  // This function establishes a persistent connection to receive real-time message updates.
  const setup = async () => {
    const user = getAuth().currentUser;
    if (!user) return null;
    const token = await user.getIdToken();

    // The EventSource URL requires authentication, passed as a query param.
    // NOTE: In a production environment, ensure your infrastructure (like NGINX)
    // properly handles and passes Authorization headers for SSE routes.
    // Using a query parameter is a common fallback.
    const eventSource = new EventSource(`${API}/messages/stream?auth_token=${token}`);

    eventSource.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data);
        // Ignore the initial connection confirmation event
        if (messageData.type !== 'connection_established') {
          onNewMessage(messageData);
        }
      } catch (error) {
        console.error("SSE message parse error:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.warn("Messages SSE error. Connection may be retrying.", error);
      // EventSource will automatically attempt to reconnect.
    };
    
    return eventSource;
  };

  let eventSourceInstance = null;
  setup().then(instance => {
    eventSourceInstance = instance;
  });

  // Return a cleanup function to close the connection.
  return () => {
    if (eventSourceInstance) {
      eventSourceInstance.close();
    }
  };
}

export async function getMessages() {
  return apiGet("/messages");
}

export async function sendMessage(msg) {
  return apiSend("POST", "/messages", msg);
}

export async function markMessageAsRead(id) {
  return apiSend("PATCH", `/messages/${id}/read`, {});
}

export async function getConversation(listingId, otherUserId) {
  return apiGet(`/messages/conversations/${listingId}?otherUserId=${otherUserId}`);
}