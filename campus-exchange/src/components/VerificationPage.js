// src/components/VerificationPage.js
import { useState, useEffect } from 'react';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '@/app/firebaseConfig';

export default function VerificationPage({ user }) {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  // Test users that bypass verification - FOR DEVELOPMENT ONLY!
  const testUsers = [
    'testuser@wit.edu',
    'testbuyer@wit.edu', 
    'testseller@wit.edu',
    'testuser1@wit.edu',
    'testuser2@wit.edu',
    'demissied@wit.edu'  // Your main account
  ];

  useEffect(() => {
    if (user?.email && testUsers.includes(user.email)) {
      console.log('🧪 Test user detected - bypassing email verification:', user.email);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [user]);

  const handleResendEmail = async () => {
    setIsResending(true);
    setMessage('');
    
    try {
      await sendEmailVerification(user);
      setMessage('✅ Verification email sent! Please check your inbox and spam folder.');
    } catch (error) {
      setMessage('❌ Failed to send email. Please try again in a few minutes.');
      console.error('Resend verification error:', error);
    } finally {
      setIsResending(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Special handling for test users
  if (user?.email && testUsers.includes(user.email)) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconContainer}>
            <span style={styles.icon}>🧪</span>
          </div>
          <h1 style={styles.title}>Test User Detected</h1>
          <p style={styles.description}>
            Bypassing email verification for testing purposes...
          </p>
          <p style={styles.testUserInfo}>
            User: {user.email}
          </p>
          <div style={styles.loadingDots}>
            <span>●</span><span>●</span><span>●</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.iconContainer}>
          <span style={styles.icon}>📧</span>
        </div>
        
        <h1 style={styles.title}>Verify Your WIT Email</h1>
        
        <div style={styles.content}>
          <p style={styles.description}>
            We sent a verification link to:
          </p>
          <p style={styles.email}>{user.email}</p>
          
          <div style={styles.instructions}>
            <h3 style={styles.instructionsTitle}>Next Steps:</h3>
            <ol style={styles.instructionsList}>
              <li>Check your email inbox for a message from Firebase</li>
              <li>Click the verification link in the email</li>
              <li>Return here and click "I've Verified My Email"</li>
            </ol>
          </div>
          
          <div style={styles.tips}>
            <p style={styles.tipsTitle}>💡 Can't find the email?</p>
            <ul style={styles.tipsList}>
              <li>Check your spam/junk folder</li>
              <li>Wait a few minutes - it can take time to arrive</li>
              <li>Make sure you're checking the right email account</li>
            </ul>
          </div>
          
          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}
        </div>
        
        <div style={styles.actions}>
          <button
            onClick={handleRefresh}
            style={styles.primaryButton}
          >
            ✅ I've Verified My Email
          </button>
          
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            style={styles.secondaryButton}
          >
            {isResending ? '📤 Sending...' : '📨 Resend Email'}
          </button>
          
          <button
            onClick={() => auth.signOut()}
            style={styles.tertiaryButton}
          >
            Sign Out
          </button>
        </div>
        
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Having trouble? Contact{' '}
            <a href="mailto:support@wit.edu" style={styles.footerLink}>
              support@wit.edu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '3rem',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  iconContainer: {
    marginBottom: '1.5rem'
  },
  icon: {
    fontSize: '4rem',
    display: 'block'
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    color: '#1a202c'
  },
  content: {
    textAlign: 'left',
    marginBottom: '2rem'
  },
  description: {
    fontSize: '1rem',
    color: '#64748b',
    marginBottom: '0.5rem',
    textAlign: 'center'
  },
  email: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#003366',
    marginBottom: '2rem',
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe'
  },
  testUserInfo: {
    fontSize: '1rem',
    color: '#059669',
    marginBottom: '1rem',
    fontWeight: '500'
  },
  instructions: {
    marginBottom: '1.5rem'
  },
  instructionsTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem'
  },
  instructionsList: {
    paddingLeft: '1.25rem',
    color: '#64748b'
  },
  tips: {
    backgroundColor: '#fffbeb',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #fed7aa',
    marginBottom: '1rem'
  },
  tipsTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#92400e',
    marginBottom: '0.5rem'
  },
  tipsList: {
    paddingLeft: '1.25rem',
    color: '#92400e',
    fontSize: '0.875rem',
    margin: 0
  },
  message: {
    padding: '1rem',
    borderRadius: '8px',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    color: '#0c4a6e',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginBottom: '1.5rem'
  },
  primaryButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  secondaryButton: {
    backgroundColor: '#003366',
    color: 'white',
    border: 'none',
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: '2px solid #e2e8f0',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  footer: {
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0'
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0
  },
  footerLink: {
    color: '#003366',
    textDecoration: 'none',
    fontWeight: '500'
  },
  loadingDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    marginTop: '1rem'
  }
};