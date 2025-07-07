// src/components/VerificationPage.js
"use client";

import { useState } from "react";
import { auth } from "../app/firebaseConfig"; // Adjust the import path as needed
import { sendEmailVerification, reload } from "firebase/auth";

export default function VerificationPage({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const testUsers = [
    'testuser@wit.edu',
    'testbuyer@wit.edu', 
    'testseller@wit.edu',
    'testuser1@wit.edu',
    'testuser2@wit.edu',
    'demissied@wit.edu'
  ];

  const handleResendVerification = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await sendEmailVerification(user);
      setMessage("Verification email sent! Please check your inbox and spam folder.");
    } catch (err) {
      console.error("Resend verification error:", err);
      setError("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await reload(user);
      if (user.emailVerified) {
        setMessage("Email verified successfully! Redirecting...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError("Email not yet verified. Please check your email and click the verification link.");
      }
    } catch (err) {
      console.error("Check verification error:", err);
      setError("Failed to check verification status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  const isTestUser = user?.email && testUsers.includes(user.email);

  if (isTestUser) {
    return null; // Test users bypass verification
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.icon}>
              <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22,6 12,13 2,6" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={styles.title}>Verify Your Email</h1>
          <p style={styles.subtitle}>
            We've sent a verification link to
          </p>
          <p style={styles.email}>{user?.email}</p>
        </div>

        <div style={styles.content}>
          <p style={styles.description}>
            Please check your email and click the verification link to activate your account. 
            You may need to check your spam or junk folder.
          </p>

          {message && (
            <div style={styles.success}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.successIcon}>
                <path d="M9 12L11 14L15 10" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="10" stroke="#059669" strokeWidth="2"/>
              </svg>
              {message}
            </div>
          )}

          {error && (
            <div style={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.errorIcon}>
                <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          )}

          <div style={styles.actions}>
            <button
              onClick={handleCheckVerification}
              style={styles.primaryButton}
              disabled={loading}
            >
              {loading ? (
                <div style={styles.loadingSpinner}>
                  <div style={styles.spinner}></div>
                  Checking...
                </div>
              ) : (
                "I've Verified My Email"
              )}
            </button>

            <button
              onClick={handleResendVerification}
              style={styles.secondaryButton}
              disabled={loading}
            >
              Resend Verification Email
            </button>
          </div>

          <div style={styles.footer}>
            <p style={styles.footerText}>
              Wrong email address?
            </p>
            <button
              onClick={handleSignOut}
              style={styles.signOutButton}
              disabled={loading}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    padding: '2rem'
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    padding: '3rem 2rem'
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  iconContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: '1.5rem'
  },
  icon: {
    opacity: 0.8
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    color: '#000000',
    margin: '0 0 1rem 0'
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: '#666666',
    margin: '0 0 0.5rem 0',
    fontWeight: '400'
  },
  email: {
    fontSize: '1rem',
    color: '#000000',
    fontWeight: '500',
    margin: 0,
    letterSpacing: '-0.01em'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  description: {
    fontSize: '0.9375rem',
    color: '#666666',
    lineHeight: '1.5',
    textAlign: 'center',
    margin: 0,
    fontWeight: '400'
  },
  success: {
    backgroundColor: '#f0fdf4',
    color: '#059669',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid #bbf7d0',
    fontWeight: '400'
  },
  successIcon: {
    flexShrink: 0
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid #fecaca',
    fontWeight: '400'
  },
  errorIcon: {
    flexShrink: 0
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem'
  },
  primaryButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    padding: '0.875rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px'
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1px solid #e5e5e5',
    padding: '0.875rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '-0.01em'
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  footer: {
    textAlign: 'center',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #f0f0f0'
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#666666',
    margin: '0 0 0.75rem 0',
    fontWeight: '400'
  },
  signOutButton: {
    background: 'none',
    border: 'none',
    color: '#666666',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'color 0.2s ease'
  }
};