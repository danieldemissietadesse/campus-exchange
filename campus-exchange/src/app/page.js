"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, sendEmailVerification, reload } from "firebase/auth";

// Express‑API helpers (use these instead of talking to Firestore directly)
import {
  streamListings,
  createListing,
  deleteListing,
  streamMessages,
  sendMessage,
  markMessageAsRead,
} from "@/lib/api";

import Auth from "@/components/Auth";
import MessageConversation from "@/components/MessageConversation";

export default function HomePage() {
  /* --------------------------------------------------------------------
   * auth + email‑verification gate
   * ------------------------------------------------------------------*/
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) return setUser(null);
      await reload(u);
      setUser(u);
      setAuthed(u.emailVerified);
      if (!u.emailVerified) setCheckingEmail(true);
    });
    return () => off();
  }, []);

  /* --------------------------------------------------------------------
   * live data streams (Server‑Sent Events)
   * ------------------------------------------------------------------*/
  const [listings, setListings] = useState([]);
  const [messages, setMessages] = useState([]);

  // listings stream (all listings)
  useEffect(() => {
    if (!authed) return;
    const unsub = streamListings(setListings);
    return () => unsub();
  }, [authed]);

  // messages stream (for this user)
  useEffect(() => {
    if (!authed) return;
    const unsub = streamMessages(user.uid, setMessages);
    return () => unsub();
  }, [authed, user?.uid]);

  /* --------------------------------------------------------------------
   * derived helpers
   * ------------------------------------------------------------------*/
  const unreadCount = messages.filter((m) => !m.read && m.recipientId === user?.uid).length;

  /* --------------------------------------------------------------------
   * UI state – identical to your original styled version
   * ------------------------------------------------------------------*/
  const [loading, setLoading] = useState(false); // quick‑post modal etc.
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", price: "", category: "", description: "" });

  /* --------------------------------------------------------------------
   * actions
   * ------------------------------------------------------------------*/
  async function handleQuickPost() {
    const title = prompt("Quick title?");
    if (!title) return;
    await createListing({
      title,
      price: 0,
      category: "Misc",
      description: "",
      userId: user.uid,
      userEmail: user.email,
    });
  }

  async function handleDelete(id) {
    await deleteListing(id);
  }

  /* --------------------------------------------------------------------
   * render gates
   * ------------------------------------------------------------------*/
  if (!user) return <Auth onAuth={() => {}} />;

  if (!authed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 32 }}>
        <h2>Verify your WIT email first 📧</h2>
        <button
          onClick={async () => {
            await sendEmailVerification(user);
            alert("Verification link sent – check inbox");
          }}
        >
          Resend email
        </button>
        <button onClick={() => auth.signOut()}>Logout</button>
      </div>
    );
  }

  /* --------------------------------------------------------------------
   * 🎨 full styled layout (same structure you had before)
   * ------------------------------------------------------------------*/
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f3f4f6" }}>
      {/* HEADER */}
      <header style={{ background: "#003366", color: "#fff", padding: "1.5rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem" }}>📦 Campus Exchange</h1>
          <div>
            {user.email} • <button onClick={() => auth.signOut()}>logout</button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, maxWidth: 800, margin: "40px auto", width: "100%" }}>
        {/* quick demo post – replace with your modal when ready */}
        <section style={{ marginBottom: 32 }}>
          <button onClick={handleQuickPost}>+ quick post</button>
        </section>

        <h2>
          Listings ({listings.length})
          {loading && " …"}
        </h2>
        {listings.length === 0 ? (
          <p>No listings yet</p>
        ) : (
          <ul>
            {listings.map((l) => (
              <li key={l.id} style={{ margin: "8px 0" }}>
                {l.title}
                {l.userId === user.uid && (
                  <button onClick={() => handleDelete(l.id)} style={{ marginLeft: 8 }}>
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <h2 style={{ marginTop: 40 }}>
          Messages {unreadCount > 0 && <span style={{ color: "red" }}>• {unreadCount}</span>}
        </h2>
        {messages.length === 0 ? (
          <p>no messages yet</p>
        ) : (
          <ul>
            {messages.map((m) => (
              <li key={m.id} style={{ margin: "6px 0" }}>
                {m.read ? "" : "★ "}
                {m.message}
                <button onClick={() => markMessageAsRead(m.id)} style={{ marginLeft: 8 }}>
                  mark read
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#f9fafb", padding: "1.5rem", textAlign: "center", fontSize: 12, color: "#6b7280" }}>
        © 2025 Campus Exchange
      </footer>
    </div>
  );
}
