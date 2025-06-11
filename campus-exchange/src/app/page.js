'use client';

import { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from '@/components/Auth';
import { createListing, getListings } from '@/lib/db';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    contactMethod: 'email'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadListings();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadListings = async () => {
    try {
      const data = await getListings();
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createListing({
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        price: parseFloat(formData.price)
      });
      await loadListings();
      setShowModal(false);
      setFormData({ title: '', category: '', price: '', description: '', contactMethod: 'email' });
      alert('Item posted successfully!');
    } catch (error) {
      alert('Error posting item: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column'
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
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      margin: 0
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem'
    },
    main: {
      flex: 1,
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '2rem',
      width: '100%'
    },
    searchSection: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    searchBar: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1rem'
    },
    searchInput: {
      flex: 1,
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '1rem'
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#6b7280',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#ef4444',
      color: 'white',
      padding: '0.5rem 1rem'
    },
    categories: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    },
    categoryChip: {
      padding: '0.5rem 1rem',
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginTop: '2rem'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    },
    cardImage: {
      width: '100%',
      height: '200px',
      backgroundColor: '#e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9ca3af'
    },
    cardContent: {
      padding: '1rem'
    },
    cardTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#111827'
    },
    cardPrice: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#10b981',
      marginBottom: '0.5rem'
    },
    cardMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      width: '90%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'auto'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      fontWeight: '500',
      color: '#374151'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '1rem'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '1rem',
      backgroundColor: 'white'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '1rem',
      minHeight: '100px',
      resize: 'vertical'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>📦 Campus Exchange</h1>
          <div style={styles.userInfo}>
            <span>{user.email}</span>
            <button 
              onClick={() => auth.signOut()} 
              style={{...styles.button, ...styles.dangerButton}}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Search Section */}
        <div style={styles.searchSection}>
          <div style={styles.searchBar}>
            <input 
              type="text" 
              placeholder="Search for textbooks, furniture, electronics..."
              style={styles.searchInput}
            />
            <button 
              onClick={() => setShowModal(true)}
              style={{...styles.button, ...styles.primaryButton}}
            >
              + Post New Item
            </button>
          </div>
          
          <div style={styles.categories}>
            <div style={styles.categoryChip}>📚 All Categories</div>
            <div style={styles.categoryChip}>📖 Textbooks</div>
            <div style={styles.categoryChip}>💻 Electronics</div>
            <div style={styles.categoryChip}>🪑 Furniture</div>
            <div style={styles.categoryChip}>👕 Clothing</div>
            <div style={styles.categoryChip}>🏠 Dorm Supplies</div>
          </div>
        </div>

        {/* Listings Grid */}
        <h2 style={{ marginBottom: '1rem', color: '#111827' }}>Recent Listings</h2>
        <div style={styles.grid}>
          {listings.length > 0 ? (
            listings.map((listing) => (
              <div key={listing.id} style={styles.card}>
                <div style={styles.cardImage}>
                  {listing.imageUrl ? (
                    <img src={listing.imageUrl} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>No Image</span>
                  )}
                </div>
                <div style={styles.cardContent}>
                  <h3 style={styles.cardTitle}>{listing.title}</h3>
                  <p style={styles.cardPrice}>${listing.price}</p>
                  <div style={styles.cardMeta}>
                    <span>{listing.category}</span>
                    <span>{new Date(listing.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <p>No listings yet. Be the first to post!</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#f9fafb',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#6b7280',
        marginTop: 'auto'
      }}>
        <p>© 2025 Campus Exchange • A WIT Student Initiative</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
          Exclusively for WIT students with verified @wit.edu emails
        </p>
      </footer>

      {/* Post Modal */}
      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', color: '#111827' }}>Post New Item</h2>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Item Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={styles.input}
                  placeholder="e.g., Calculus Textbook"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={styles.select}
                  required
                >
                  <option value="">Select a category</option>
                  <option value="Textbooks">Textbooks</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Dorm Supplies">Dorm Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Price ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  style={styles.input}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={styles.textarea}
                  placeholder="Describe your item (condition, size, etc.)"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit"
                  style={{...styles.button, ...styles.primaryButton, flex: 1}}
                >
                  Post Item
                </button>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{...styles.button, ...styles.secondaryButton, flex: 1}}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}