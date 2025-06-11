'use client';

import { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from '@/components/Auth';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return <Auth onAuth={() => window.location.reload()} />;
  }

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      padding: '2rem'
    },
    header: {
      backgroundColor: '#1e3a8a',
      color: 'white',
      padding: '1rem',
      marginBottom: '2rem',
      borderRadius: '8px'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    },
    content: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    button: {
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '1rem',
      fontSize: '1rem'
    },
    addButton: {
      backgroundColor: '#10b981',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      marginBottom: '2rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Campus Exchange</h1>
        <p>Welcome, {user.email}</p>
      </div>

      <div style={styles.content}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          WIT Student Marketplace
        </h2>
        
        <button style={styles.addButton}>
          + Post New Item
        </button>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            Recent Listings
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {/* Sample listings */}
            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1rem',
              backgroundColor: '#f9fafb'
            }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Calculus Textbook
              </h4>
              <p style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                $45
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Posted 2 hours ago
              </p>
            </div>

            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1rem',
              backgroundColor: '#f9fafb'
            }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Desk Lamp
              </h4>
              <p style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                $20
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Posted 5 hours ago
              </p>
            </div>

            <div style={{ 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px', 
              padding: '1rem',
              backgroundColor: '#f9fafb'
            }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Office Chair
              </h4>
              <p style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: 'bold' }}>
                $75
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Posted 1 day ago
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => auth.signOut()} 
          style={styles.button}
        >
          Logout
        </button>
      </div>
    </div>
  );
}