// src/components/Auth.js
"use client";

import { useState } from "react";
import { auth } from "../app/firebaseConfig"; // Adjust the import path as needed
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function Auth({ onAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const testUsers = ['testuser@wit.edu'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!form.email || !form.password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (!form.email.endsWith("@wit.edu")) {
      setError("Please use a valid WIT email address");
      setLoading(false);
      return;
    }

    if (isSignUp && form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, form.email, form.password);
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      }
      onAuth();
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <h1 style={styles.logoText}>Campus Exchange</h1>
          <p style={styles.logoSubtext}>
            {isSignUp ? "Create your account" : "Welcome Back!"}
          </p>
          <p style={styles.logoDescription}>
            {isSignUp 
              ? "Join the WIT student marketplace" 
              : "Sign in to access the WIT student marketplace"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>WIT Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="your.name@wit.edu"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              style={styles.input}
              disabled={loading}
            />
          </div>

          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                style={styles.input}
                disabled={loading}
              />
            </div>
          )}

          {!isSignUp && (
            <div style={styles.forgotPassword}>
              <a href="#" style={styles.forgotLink}>Forgot your password?</a>
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

          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(loading ? styles.buttonLoading : {})
            }}
            disabled={loading}
          >
            {loading ? (
              <div style={styles.loadingSpinner}>
                <div style={styles.spinner}></div>
                {isSignUp ? "Creating Account..." : "Signing In..."}
              </div>
            ) : (
              isSignUp ? "Create Account" : "Sign In"
            )}
          </button>

          <div style={styles.switchText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setForm({ email: "", password: "", confirmPassword: "" });
              }}
              style={styles.switchLink}
              disabled={loading}
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </div>
        </form>
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
    maxWidth: '400px',
    padding: '3rem 2rem'
  },
  logo: {
    textAlign: 'center',
    marginBottom: '3rem'
  },
  logoText: {
    fontSize: '1.75rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    color: '#000000',
    margin: '0 0 0.5rem 0'
  },
  logoSubtext: {
    fontSize: '1.25rem',
    fontWeight: '500',
    color: '#000000',
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.01em'
  },
  logoDescription: {
    fontSize: '0.9375rem',
    color: '#666666',
    margin: 0,
    fontWeight: '400',
    lineHeight: '1.4'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#000000',
    letterSpacing: '-0.01em'
  },
  input: {
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontWeight: '400',
    color: '#000000'
  },
  forgotPassword: {
    textAlign: 'right',
    marginTop: '-0.5rem'
  },
  forgotLink: {
    fontSize: '0.875rem',
    color: '#666666',
    textDecoration: 'none',
    fontWeight: '400',
    transition: 'color 0.2s ease'
  },
  button: {
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
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px'
  },
  buttonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed'
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
  switchText: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#666666',
    fontWeight: '400'
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#000000',
    textDecoration: 'none',
    fontWeight: '500',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: 0,
    transition: 'color 0.2s ease'
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
  }
};

