// src/components/ListingDetailModal.js
"use client";

import { useState, useEffect } from "react";
import { saveListing, unsaveListing, deleteListing, getSavedListings } from '@/lib/api';

export default function ListingDetailModal({ listing, currentUser, onClose, onMessageClick }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Check if listing is saved on mount
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!currentUser) {
        setIsSaved(false);
        return;
      }
      
      try {
        const savedListings = await getSavedListings();
        const isListingSaved = savedListings.some(saved => saved.id === listing.id);
        setIsSaved(isListingSaved);
      } catch (error) {
        console.error('Error checking if listing is saved:', error);
        setIsSaved(false);
      }
    };

    checkIfSaved();
  }, [listing.id, currentUser]);

  const handleSaveToggle = async () => {
    if (!currentUser) {
      alert('Please sign in to save listings');
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        await unsaveListing(listing.id);
        setIsSaved(false);
      } else {
        await saveListing(listing.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      alert('Failed to save listing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteListing(listing.id);
      alert('Listing deleted successfully!');
      onClose(); // Close the modal
      window.location.reload(); // Refresh to update the listings
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Just now';
    }
    
    if (isNaN(date.getTime())) return 'Just now';
    
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSellerName = (email) => {
    if (!email) return 'Unknown Seller';
    return email.split('@')[0];
  };

  const isOwnListing = currentUser?.uid === listing.userId;
  const hasImages = listing.imageUrls && listing.imageUrls.length > 0;

  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => 
        prev === listing.imageUrls.length - 1 ? 0 : prev + 1
      );
      setImageLoading(true);
    }
  };

  const prevImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? listing.imageUrls.length - 1 : prev - 1
      );
      setImageLoading(true);
    }
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
    setImageLoading(true);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerInfo}>
            <span style={styles.categoryBadge}>{listing.category}</span>
            <span style={styles.itemId}>#{listing.id.slice(-6).toUpperCase()}</span>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="#666666" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="#666666" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={styles.content}>
          {/* Image Gallery */}
          <div style={styles.imageSection}>
            {hasImages ? (
              <div style={styles.imageContainer}>
                <div style={styles.mainImageContainer}>
                  {imageLoading && (
                    <div style={styles.imageLoader}>
                      <div style={styles.spinner}></div>
                    </div>
                  )}
                  <img
                    src={listing.imageUrls[currentImageIndex]}
                    alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                    style={{
                      ...styles.mainImage,
                      opacity: imageLoading ? 0 : 1
                    }}
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                  
                  {listing.imageUrls.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage} 
                        style={styles.navButton}
                        aria-label="Previous image"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <polyline points="15,18 9,12 15,6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button 
                        onClick={nextImage} 
                        style={{...styles.navButton, right: '1rem'}}
                        aria-label="Next image"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <polyline points="9,18 15,12 9,6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      
                      <div style={styles.imageCounter}>
                        {currentImageIndex + 1} / {listing.imageUrls.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Navigation */}
                {listing.imageUrls.length > 1 && (
                  <div style={styles.thumbnailContainer}>
                    {listing.imageUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        style={{
                          ...styles.thumbnail,
                          ...(index === currentImageIndex ? styles.thumbnailActive : {})
                        }}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${index + 1}`}
                          style={styles.thumbnailImage}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.noImageContainer}>
                <div style={styles.noImageIcon}>
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V9" stroke="#cccccc" strokeWidth="1.5"/>
                    <circle cx="9" cy="9" r="3" stroke="#cccccc" strokeWidth="1.5"/>
                    <path d="M21 15L17 11L5 23" stroke="#cccccc" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span style={styles.noImageText}>No images available</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div style={styles.details}>
            {/* Title and Price */}
            <div style={styles.titleSection}>
              <h1 style={styles.title}>{listing.title}</h1>
              <div style={styles.priceContainer}>
                <span style={styles.price}>${listing.price}</span>
                <span style={styles.priceLabel}>USD</span>
              </div>
            </div>

            {/* Description */}
            <div style={styles.descriptionSection}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.description}>{listing.description}</p>
            </div>

            {/* Seller Information */}
            <div style={styles.sellerSection}>
              <h3 style={styles.sectionTitle}>Seller</h3>
              <div style={styles.sellerCard}>
                <div style={styles.sellerAvatar}>
                  <span style={styles.sellerInitial}>
                    {getSellerName(listing.userEmail).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div style={styles.sellerInfo}>
                  <p style={styles.sellerName}>{getSellerName(listing.userEmail)}</p>
                  <p style={styles.sellerEmail}>{listing.userEmail}</p>
                  <div style={styles.sellerBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={styles.verifiedIcon}>
                      <path d="M9 12L11 14L15 10" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="10" stroke="#059669" strokeWidth="2"/>
                    </svg>
                    WIT Student
                  </div>
                </div>
              </div>
            </div>

            {/* Item Details */}
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Posted</span>
                <span style={styles.detailValue}>{formatDate(listing.createdAt)}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Category</span>
                <span style={styles.detailValue}>{listing.category}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Condition</span>
                <span style={styles.detailValue}>Used</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Location</span>
                <span style={styles.detailValue}>WIT Campus</span>
              </div>
            </div>

            {/* Actions */}
            {!isOwnListing ? (
              <div style={styles.actions}>
                <button onClick={onMessageClick} style={styles.messageButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={styles.messageIcon}>
                    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Contact Seller
                </button>
                <button 
                  style={{
                    ...styles.favoriteButton,
                    backgroundColor: isSaved ? '#000000' : 'transparent',
                    color: isSaved ? '#ffffff' : '#000000'
                  }}
                  onClick={handleSaveToggle}
                  disabled={saving}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} style={styles.favoriteIcon}>
                    <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61V4.61Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {saving ? 'Saving...' : (isSaved ? 'Saved' : 'Save')}
                </button>
              </div>
            ) : (
              <div style={styles.ownListingSection}>
                <div style={styles.ownListingNotice}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.infoIcon}>
                    <circle cx="12" cy="12" r="10" stroke="#666666" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12" y2="12" stroke="#666666" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12.01" y2="8" stroke="#666666" strokeWidth="2"/>
                  </svg>
                  This is your listing
                </div>
                <button
                  onClick={handleDeleteListing}
                  disabled={deleting}
                  style={styles.deleteListingButton}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.deleteIcon}>
                    <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19ZM10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {deleting ? 'Deleting...' : 'Delete Listing'}
                </button>
              </div>
            )}
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
    padding: '2rem'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif'
  },
  header: {
    padding: '1.5rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f0f0f0'
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  categoryBadge: {
    fontSize: '0.75rem',
    fontWeight: '500',
    color: '#666666',
    backgroundColor: '#f5f5f5',
    padding: '0.375rem 0.75rem',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  itemId: {
    fontSize: '0.75rem',
    color: '#999999',
    fontWeight: '400',
    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '2rem',
    padding: '2rem',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '1.5rem'
    }
  },
  imageSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  imageContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  mainImageContainer: {
    position: 'relative',
    width: '100%',
    height: '400px',
    backgroundColor: '#fafafa',
    borderRadius: '16px',
    overflow: 'hidden'
  },
  imageLoader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f0f0f0',
    borderTop: '3px solid #000000',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  mainImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease'
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    left: '1rem',
    transform: 'translateY(-50%)',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(10px)'
  },
  imageCounter: {
    position: 'absolute',
    bottom: '1rem',
    right: '1rem',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#ffffff',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '500',
    backdropFilter: 'blur(10px)'
  },
  thumbnailContainer: {
    display: 'flex',
    gap: '0.5rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem'
  },
  thumbnail: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  thumbnailActive: {
    borderColor: '#000000'
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noImageContainer: {
    height: '400px',
    backgroundColor: '#fafafa',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem'
  },
  noImageIcon: {
    opacity: 0.4
  },
  noImageText: {
    fontSize: '1rem',
    color: '#999999',
    fontWeight: '400'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem'
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '600',
    color: '#000000',
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: '1.2'
  },
  priceContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  price: {
    fontSize: '2.25rem',
    fontWeight: '700',
    color: '#000000',
    letterSpacing: '-0.03em'
  },
  priceLabel: {
    fontSize: '1rem',
    color: '#666666',
    fontWeight: '500'
  },
  descriptionSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  sectionTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#000000',
    margin: 0,
    letterSpacing: '-0.01em'
  },
  description: {
    fontSize: '1rem',
    color: '#666666',
    lineHeight: '1.6',
    margin: 0,
    fontWeight: '400'
  },
  sellerSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  sellerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#fafafa',
    borderRadius: '12px',
    border: '1px solid #f0f0f0'
  },
  sellerAvatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  sellerInitial: {
    color: '#ffffff',
    fontSize: '1.25rem',
    fontWeight: '600'
  },
  sellerInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  sellerName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#000000',
    margin: 0,
    letterSpacing: '-0.01em'
  },
  sellerEmail: {
    fontSize: '0.875rem',
    color: '#666666',
    margin: 0,
    fontWeight: '400'
  },
  sellerBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    color: '#059669',
    fontWeight: '500',
    marginTop: '0.25rem'
  },
  verifiedIcon: {
    flexShrink: 0
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    padding: '1.5rem',
    backgroundColor: '#fafafa',
    borderRadius: '12px',
    border: '1px solid #f0f0f0'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: '#999999',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  detailValue: {
    fontSize: '0.9375rem',
    color: '#000000',
    fontWeight: '500'
  },
  actions: {
    display: 'flex',
    gap: '1rem'
  },
  messageButton: {
    flex: 1,
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  messageIcon: {
    flexShrink: 0
  },
  favoriteButton: {
    backgroundColor: '#ffffff',
    color: '#666666',
    border: '1px solid #e5e5e5',
    padding: '1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  favoriteIcon: {
    flexShrink: 0
  },
  ownListingSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  ownListingNotice: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1rem 1.5rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '12px',
    fontSize: '0.9375rem',
    color: '#666666',
    fontWeight: '500',
    border: '1px solid #e5e5e5'
  },
  infoIcon: {
    flexShrink: 0
  },
  deleteListingButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.9375rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%'
  },
  deleteIcon: {
    flexShrink: 0
  }
};