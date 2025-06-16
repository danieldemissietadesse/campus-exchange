// src/components/ProfileSection.js
import { useState } from 'react';
import { deleteListing } from '@/lib/api';

export default function ProfileSection({ user, userListings }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteListing = async (listingId, listingTitle) => {
    if (window.confirm(`Are you sure you want to delete "${listingTitle}"?`)) {
      setDeletingId(listingId);
      try {
        await deleteListing(listingId);
        
        // Success notification
        const notification = document.createElement('div');
        notification.textContent = '✅ Listing deleted successfully!';
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #10b981;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          z-index: 10000;
          font-weight: 500;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
      } catch (error) {
        alert('Error deleting listing: ' + error.message);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatMemberSince = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const getTotalValue = () => {
    return userListings.reduce((total, listing) => total + (listing.price || 0), 0);
  };

  const getCategoryBreakdown = () => {
    const breakdown = {};
    userListings.forEach(listing => {
      breakdown[listing.category] = (breakdown[listing.category] || 0) + 1;
    });
    return breakdown;
  };

  const categoryBreakdown = getCategoryBreakdown();

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👤 My Profile</h2>
      
      <div style={styles.profileGrid}>
        {/* Account Info Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}>ℹ️</span>
              Account Information
            </h3>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Email:</span>
              <span style={styles.infoValue}>{user.email}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Member Since:</span>
              <span style={styles.infoValue}>
                {formatMemberSince(user.metadata.creationTime)}
              </span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Account Status:</span>
              <span style={{...styles.infoValue, ...styles.verifiedBadge}}>
                ✅ Verified WIT Student
              </span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>
              <span style={styles.cardIcon}>📊</span>
              My Statistics
            </h3>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>{userListings.length}</span>
                <span style={styles.statLabel}>Active Listings</span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statNumber}>${getTotalValue()}</span>
                <span style={styles.statLabel}>Total Value</span>
              </div>
            </div>
            
            {Object.keys(categoryBreakdown).length > 0 && (
              <div style={styles.categoryStats}>
                <h4 style={styles.categoryTitle}>Categories:</h4>
                <div style={styles.categoryList}>
                  {Object.entries(categoryBreakdown).map(([category, count]) => (
                    <div key={category} style={styles.categoryItem}>
                      <span>{getCategoryIcon(category)} {category}</span>
                      <span style={styles.categoryCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Listings Section */}
      <div style={styles.listingsSection}>
        <div style={styles.listingsHeader}>
          <h3 style={styles.listingsTitle}>
            <span style={styles.cardIcon}>🏪</span>
            My Active Listings ({userListings.length})
          </h3>
        </div>
        
        {userListings.length > 0 ? (
          <div style={styles.listingsGrid}>
            {userListings.map(listing => (
              <div key={listing.id} style={styles.listingCard}>
                <div style={styles.listingImage}>
                  {listing.imageUrls && listing.imageUrls.length > 0 ? (
                    <img 
                      src={listing.imageUrls[0]} 
                      alt={listing.title}
                      style={styles.listingImg}
                    />
                  ) : (
                    <div style={styles.noImage}>
                      <span style={styles.noImageIcon}>📷</span>
                    </div>
                  )}
                </div>
                
                <div style={styles.listingInfo}>
                  <h4 style={styles.listingTitle}>{listing.title}</h4>
                  <p style={styles.listingPrice}>${listing.price}</p>
                  <p style={styles.listingCategory}>
                    {getCategoryIcon(listing.category)} {listing.category}
                  </p>
                  
                  <button
                    onClick={() => handleDeleteListing(listing.id, listing.title)}
                    disabled={deletingId === listing.id}
                    style={{
                      ...styles.deleteButton,
                      opacity: deletingId === listing.id ? 0.6 : 1,
                      cursor: deletingId === listing.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {deletingId === listing.id ? '🗑️ Deleting...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyListings}>
            <span style={styles.emptyIcon}>📦</span>
            <h3 style={styles.emptyTitle}>No active listings</h3>
            <p style={styles.emptyText}>
              You haven't posted any items yet. Start selling by clicking "Post New Item"!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getCategoryIcon(category) {
  const icons = {
    "Textbooks": "📚",
    "Electronics": "💻",
    "Furniture": "🪑", 
    "Clothing": "👕",
    "Dorm Supplies": "🏠",
    "Other": "📦"
  };
  return icons[category] || "📦";
}

const styles = {
  container: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '2rem',
    color: '#1a202c',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  profileGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '1.5rem 1.5rem 0 1.5rem'
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  cardIcon: {
    fontSize: '1.25rem'
  },
  cardContent: {
    padding: '1.5rem'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f1f5f9'
  },
  infoLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: '0.875rem',
    color: '#1a202c',
    fontWeight: '600'
  },
  verifiedBadge: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  statItem: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  statNumber: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#10b981',
    marginBottom: '0.25rem'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  categoryStats: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '1rem'
  },
  categoryTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem'
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: '#64748b'
  },
  categoryCount: {
    fontWeight: '600',
    color: '#374151'
  },
  listingsSection: {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  listingsHeader: {
    padding: '1.5rem 1.5rem 0 1.5rem'
  },
  listingsTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  listingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
    padding: '1.5rem'
  },
  listingCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f8fafc'
  },
  listingImage: {
    width: '100%',
    height: '120px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  listingImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noImage: {
    color: '#94a3b8'
  },
  noImageIcon: {
    fontSize: '2rem'
  },
  listingInfo: {
    padding: '1rem'
  },
  listingTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '0.5rem',
    lineHeight: '1.4'
  },
  listingPrice: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#10b981',
    marginBottom: '0.5rem'
  },
  listingCategory: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '1rem'
  },
  deleteButton: {
    width: '100%',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  emptyListings: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b'
  },
  emptyIcon: {
    fontSize: '3rem',
    display: 'block',
    marginBottom: '1rem'
  },
  emptyTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#374151'
  },
  emptyText: {
    fontSize: '0.875rem',
    lineHeight: '1.6'
  }
};