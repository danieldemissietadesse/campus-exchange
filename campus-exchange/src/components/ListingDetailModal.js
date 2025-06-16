// src/components/ListingDetailModal.js
import { useState } from 'react';
import { deleteListing } from '@/lib/api';

export default function ListingDetailModal({ 
  listing, 
  currentUser, 
  onClose, 
  onMessageClick 
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      setIsDeleting(true);
      try {
        await deleteListing(listing.id);
        onClose();
        
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
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return 'Just now';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      "Textbooks": "📚",
      "Electronics": "💻",
      "Furniture": "🪑",
      "Clothing": "👕", 
      "Dorm Supplies": "🏠",
      "Other": "📦"
    };
    return icons[category] || "📦";
  };

  const isOwner = listing.userId === currentUser?.uid;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{listing.title}</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {/* Image Gallery */}
          {listing.imageUrls && listing.imageUrls.length > 0 && (
            <div style={styles.imageContainer}>
              <div style={styles.imageSlider}>
                {listing.imageUrls.length > 1 && (
                  <>
                    <button
                      style={{...styles.navButton, left: '1rem'}}
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? listing.imageUrls.length - 1 : prev - 1
                      )}
                    >
                      ‹
                    </button>
                    <button
                      style={{...styles.navButton, right: '1rem'}}
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === listing.imageUrls.length - 1 ? 0 : prev + 1
                      )}
                    >
                      ›
                    </button>
                  </>
                )}
                
                <img 
                  src={listing.imageUrls[currentImageIndex]} 
                  alt={listing.title}
                  style={styles.mainImage}
                />
                
                {listing.imageUrls.length > 1 && (
                  <div style={styles.imageIndicators}>
                    {listing.imageUrls.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          ...styles.indicator,
                          ...(index === currentImageIndex ? styles.activeIndicator : {})
                        }}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {listing.imageUrls.length > 1 && (
                <div style={styles.thumbnails}>
                  {listing.imageUrls.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`${listing.title} ${index + 1}`}
                      style={{
                        ...styles.thumbnail,
                        ...(index === currentImageIndex ? styles.activeThumbnail : {})
                      }}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Listing Details */}
          <div style={styles.details}>
            <div style={styles.priceSection}>
              <span style={styles.price}>${listing.price}</span>
              <span style={styles.category}>
                {getCategoryIcon(listing.category)} {listing.category}
              </span>
            </div>

            <div style={styles.metaInfo}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Posted:</span>
                <span style={styles.metaValue}>{formatDate(listing.createdAt)}</span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Seller:</span>
                <span style={styles.metaValue}>
                  {listing.userEmail ? listing.userEmail.split('@')[0] : 'Unknown'}
                </span>
              </div>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Contact:</span>
                <span style={styles.metaValue}>{listing.userEmail || 'Email not available'}</span>
              </div>
            </div>

            <div style={styles.description}>
              <h3 style={styles.descriptionTitle}>Description</h3>
              <p style={styles.descriptionText}>{listing.description}</p>
            </div>

            <div style={styles.actions}>
              {isOwner ? (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    ...styles.deleteButton,
                    opacity: isDeleting ? 0.6 : 1,
                    cursor: isDeleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isDeleting ? '🗑️ Deleting...' : '🗑️ Delete Listing'}
                </button>
              ) : (
                <button
                  onClick={onMessageClick}
                  style={styles.messageButton}
                >
                  💬 Message Seller
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  header: {
    padding: '1.5rem 1.5rem 0 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0,
    flex: 1,
    marginRight: '1rem'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#64748b',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  content: {
    padding: '1.5rem'
  },
  imageContainer: {
    marginBottom: '2rem'
  },
  imageSlider: {
    position: 'relative',
    width: '100%',
    height: '400px',
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '48px',
    height: '48px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    zIndex: 2,
    transition: 'all 0.2s'
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  imageIndicators: {
    position: 'absolute',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '0.5rem',
    zIndex: 2
  },
  indicator: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeIndicator: {
    backgroundColor: 'white',
    transform: 'scale(1.2)'
  },
  thumbnails: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    padding: '0.5rem 0'
  },
  thumbnail: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '2px solid transparent',
    transition: 'all 0.2s'
  },
  activeThumbnail: {
    border: '2px solid #003366',
    transform: 'scale(1.05)'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  priceSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  price: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#10b981'
  },
  category: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  metaInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  metaLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  metaValue: {
    fontSize: '1rem',
    color: '#1a202c',
    fontWeight: '600'
  },
  description: {
    padding: '1rem 0'
  },
  descriptionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '0.75rem'
  },
  descriptionText: {
    fontSize: '1rem',
    color: '#374151',
    lineHeight: '1.6',
    margin: 0
  },
  actions: {
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0'
  },
  messageButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.125rem',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(0, 51, 102, 0.25)'
  },
  deleteButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1.125rem',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)'
  }
};