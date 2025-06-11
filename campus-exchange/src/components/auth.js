// src/components/Auth.js
'use client';

import { useState } from 'react';
import { auth } from '@/app/firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

export default function Auth({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.endsWith('@wit.edu')) {
      setError('Please use your WIT email (@wit.edu)');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        alert('✅ Verification email sent! Please check your inbox.');
      }
      onAuth();
    } catch (error) {
      setError(error.message.replace('Firebase: ', '').replace(/\(.*\)/, ''));
      setLoading(false);
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    header: {
      backgroundColor: '#003366',
      color: 'white',
      padding: '1.5rem 2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    logo: {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    main: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    },
    authCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
      width: '100%',
      maxWidth: '400px',
      padding: '2.5rem',
    },
    title: {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      color: '#111827',
      textAlign: 'center',
      marginBottom: '0.5rem'
    },
    subtitle: {
      fontSize: '0.875rem',
      color: '#6b7280',
      textAlign: 'center',
      marginBottom: '2rem'
    },
    formGroup: {
      marginBottom: '1.25rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      transition: 'all 0.2s',
      outline: 'none',
      boxSizing: 'border-box',
      color: '#000000', // Black text
      backgroundColor: '#ffffff'
    },
    inputFocus: {
      borderColor: '#003366',
      boxShadow: '0 0 0 3px rgba(0, 51, 102, 0.1)'
    },
    button: {
      width: '100%',
      padding: '0.875rem',
      fontSize: '1rem',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      marginTop: '0.5rem'
    },
    primaryButton: {
      backgroundColor: '#003366',
      color: 'white'
    },
    primaryButtonHover: {
      backgroundColor: '#002244'
    },
    errorBox: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      color: '#dc2626',
      padding: '0.75rem',
      borderRadius: '6px',
      fontSize: '0.875rem',
      marginBottom: '1rem'
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '1.5rem 0',
      color: '#9ca3af',
      fontSize: '0.875rem'
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#e5e7eb'
    },
    switchText: {
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    link: {
      color: '#003366',
      fontWeight: '500',
      cursor: 'pointer',
      textDecoration: 'none'
    },
    linkHover: {
      textDecoration: 'underline'
    },
    footer: {
      backgroundColor: '#f9fafb',
      padding: '1.5rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#6b7280'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>
            <span style={{ fontSize: '1.5rem' }}>📦</span>
            Campus Exchange
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.authCard}>
          <h2 style={styles.title}>
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </h2>
          <p style={styles.subtitle}>
            {isLogin 
              ? 'Sign in to buy and sell with fellow WIT students' 
              : 'Join the WIT student marketplace community'}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>WIT Email</label>
              <input
                type="email"
                placeholder="your.name@wit.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#003366'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                required
                disabled={loading}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#003366'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              style={{...styles.button, ...styles.primaryButton}}
              onMouseOver={(e) => e.target.style.backgroundColor = '#002244'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#003366'}
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={{ margin: '0 1rem' }}>or</span>
            <div style={styles.dividerLine}></div>
          </div>

          <p style={styles.switchText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={styles.link}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </span>
          </p>

          {!isLogin && (
            <p style={{ 
              fontSize: '0.75rem', 
              color: '#9ca3af', 
              textAlign: 'center', 
              marginTop: '1rem',
              lineHeight: '1.5'
            }}>
              By creating an account, you agree to follow WIT's student code of conduct 
              and marketplace guidelines.
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2025 Campus Exchange • A WIT Student Initiative</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          For support, contact: support@campusexchange.wit.edu
        </p>
      </footer>
    </div>
  );
}