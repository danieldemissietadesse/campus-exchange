"use client";

import { useState, useEffect } from "react";
import { auth, initAuthPersistence } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

export default function TestPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Setting up auth listener...');
    
    // Initialize auth persistence first
    initAuthPersistence();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? user.email : 'no user');
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth error:', error);
      setError(error.message);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth listener...');
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Test Page - Loading...</h1>
        <p>Checking authentication status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Test Page - Error</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Test Page - Success</h1>
      <p>User: {user ? user.email : 'Not logged in'}</p>
      <p>Loading completed successfully!</p>
    </div>
  );
}