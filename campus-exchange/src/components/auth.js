// src/components/Auth.js
import { useState } from 'react';
import { auth } from '@/app/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';

export default function Auth({ onAuth }) {
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setMessage('');
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    resetForm();
  };

  const validateEmail = (email) => {
    return email.endsWith('@wit.edu');
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!validateEmail(email)) {
      setError('Please use your WIT email address (@wit.edu)');
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if ((authMode === 'login' || authMode === 'signup') && !validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      switch (authMode) {
        case 'login':
          await signInWithEmailAndPassword(auth, email, password);
          onAuth();
          break;

        case 'signup':
          const { user } = await createUserWithEmailAndPassword(auth, email, password);
          await sendEmailVerification(user);
          setMessage('✅ Account created! Please check your email to verify your account.');
          setTimeout(() => switchMode('login'), 3000);
          break;

        case 'forgot':
          await sendPasswordResetEmail(auth, email);
          setMessage('✅ Password reset email sent! Check your inbox.');
          setTimeout(() => switchMode('login'), 3000);
          break;
      }
    } catch (err) {
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/email-already-in-use': 'An account already exists with this email.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/invalid-email': 'Invalid email address format.',
        'auth/too-many-requests': 'Too many failed attempts. Please wait before trying again.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/invalid-credential': 'Invalid email or password combination.',
        'auth/user-disabled': 'This account has been disabled.',
      };
      setError(errorMessages[err.code] || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPageContent = () => {
    switch (authMode) {
      case 'signup':
        return {
          title: 'Join Campus Exchange',
          subtitle: 'Create your account to start buying and selling with fellow WIT students',
          buttonText: 'Create Account',
          switchText: 'Already have an account?',
          switchAction: 'Sign In'
        };
      case 'forgot':
        return {
          title: 'Reset Password',
          subtitle: 'Enter your WIT email to receive a password reset link',
          buttonText: 'Send Reset Link',
          switchText: 'Remember your password?',
          switchAction: 'Back to Sign In'
        };
      default:
        return {
          title: 'Welcome Back!',
          subtitle: 'Sign in to access the WIT student marketplace',
          buttonText: 'Sign In',
          switchText: "Don't have an account?",
          switchAction: 'Create Account'
        };
    }
  };

  const content = getPageContent();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>
            <span style={styles.logoIcon}>📦</span>
            Campus Exchange
          </h1>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.authCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.title}>{content.title}</h2>
            <p style={styles.subtitle}>{content.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>WIT Email Address</label>
              <input
                style={styles.input}
                disabled={loading}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@wit.edu"
                required
              />
            </div>

            {authMode !== 'forgot' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  style={styles.input}
                  disabled={loading}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  required
                />
              </div>
            )}

            {authMode === 'signup' && (
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  style={styles.input}
                  disabled={loading}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            {authMode === 'login' && (
              <div style={styles.forgotPassword}>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  style={styles.forgotLink}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {error && (
              <div style={styles.errorMessage}>
                <span style={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            {message && (
              <div style={styles.successMessage}>
                <span style={styles.successIcon}>✅</span>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <span style={styles.loadingSpinner}>⏳</span>
                  {authMode === 'forgot' ? 'Sending...' : authMode === 'signup' ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                content.buttonText
              )}
            </button>
          </form>

          <div style={styles.switchSection}>
            <p style={styles.switchText}>
              {content.switchText}{' '}
              <button
                type="button"
                onClick={() => switchMode(authMode === 'login' ? 'signup' : 'login')}
                style={styles.switchLink}
                disabled={loading}
              >
                {content.switchAction}
              </button>
            </p>

            {authMode !== 'login' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={styles.backButton}
                disabled={loading}
              >
                ← Back to Sign In
              </button>
            )}
          </div>

          {authMode === 'signup' && (
            <div style={styles.termsSection}>
              <p style={styles.termsText}>
                By creating an account, you agree to follow WIT's student code of conduct
                and Campus Exchange community guidelines.
              </p>
            </div>
          )}
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p style={styles.footerText}>© 2025 Campus Exchange • A WIT Student Initiative</p>
          <p style={styles.footerSubtext}>
            For support, contact: <a href="mailto:support@wit.edu" style={styles.footerLink}>support@wit.edu</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
    color: 'white',
    padding: '1rem 2rem',
    boxShadow: '0 4px 12px rgba(0, 51, 102, 0.15)'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  logoIcon: {
    fontSize: '2rem'
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
    borderRadius: '16px',
    padding: '3rem',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '0.5rem'
  },
  subtitle: {
    fontSize: '0.975rem',
    color: '#64748b',
    lineHeight: '1.5',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151'
  },
  input: {
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    background: '#fff',
    color: '#1a202c',
    transition: 'border-color 0.2s',
    outline: 'none'
  },
  forgotPassword: {
    textAlign: 'right'
  },
  forgotLink: {
    background: 'none',
    border: 'none',
    color: '#003366',
    fontSize: '0.875rem',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    padding: '0.875rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  errorIcon: {
    fontSize: '1rem'
  },
  successMessage: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '0.875rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  successIcon: {
    fontSize: '1rem'
  },
  submitButton: {
    backgroundColor: '#003366',
    color: 'white',
    border: 'none',
    padding: '1rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  loadingSpinner: {
    fontSize: '1rem'
  },
  switchSection: {
    marginTop: '2rem',
    textAlign: 'center'
  },
  switchText: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
    marginBottom: '1rem'
  },
  switchLink: {
    background: 'none',
    border: 'none',
    color: '#003366',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '0.875rem',
    cursor: 'pointer',
    padding: '0.5rem'
  },
  termsSection: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e2e8f0'
  },
  termsText: {
    fontSize: '0.75rem',
    color: '#64748b',
    lineHeight: '1.5',
    textAlign: 'center',
    margin: 0
  },
  footer: {
    backgroundColor: '#f1f5f9',
    padding: '1.5rem',
    borderTop: '1px solid #e2e8f0'
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#374151',
    margin: 0,
    marginBottom: '0.25rem'
  },
  footerSubtext: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0
  },
  footerLink: {
    color: '#003366',
    textDecoration: 'none'
  }
};