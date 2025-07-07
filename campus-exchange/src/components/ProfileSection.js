// src/components/ProfileSection.js
"use client";

import { useState, useRef } from "react";
import { auth } from "../app/firebaseConfig"; // Adjust the import path as needed

export default function ProfileSection({ user, userListings }) {
  const [activeTab, setActiveTab] = useState("listings");
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

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
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDisplayName = (email) => {
    if (!email) return 'User';
    return email.split('@')[0];
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);

      // Here you would typically upload to Firebase Storage
      // For now, we'll just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Profile image uploaded successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert('Failed to upload image. Please try again.');
      setProfileImage(null);
    } finally {
      setUploading(false);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.container}>
      {/* Profile Header */}
      <div style={styles.header}>
        <div style={styles.profileInfo}>
          <div style={styles.avatarContainer}>
            <div style={styles.avatar}>
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  style={styles.avatarImage}
                />
              ) : (
                <span style={styles.avatarText}>
                  {getDisplayName(user?.email).charAt(0).toUpperCase()}
                </span>
              )}
              {uploading && (
                <div style={styles.uploadingOverlay}>
                  <div style={styles.uploadSpinner}></div>
                </div>
              )}
            </div>
            
            <div style={styles.avatarActions}>
              <button 
                onClick={triggerImageUpload} 
                style={styles.uploadButton}
                disabled={uploading}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.uploadIcon}>
                  <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V9" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M21 15L17 11L5 23" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                {profileImage ? 'Change Photo' : 'Add Photo'}
              </button>
              
              {profileImage && (
                <button 
                  onClick={removeProfileImage} 
                  style={styles.removeButton}
                  disabled={uploading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.removeIcon}>
                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Remove
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={styles.hiddenInput}
            />
          </div>
          
          <div style={styles.userDetails}>
            <h1 style={styles.displayName}>{getDisplayName(user?.email)}</h1>
            <p style={styles.email}>{user?.email}</p>
            <div style={styles.stats}>
              <span style={styles.stat}>
                <span style={styles.statNumber}>{userListings.length}</span>
                <span style={styles.statLabel}>Active Listings</span>
              </span>
              <span style={styles.statDivider}>•</span>
              <span style={styles.stat}>
                <span style={styles.statLabel}>Member since</span>
                <span style={styles.statValue}>{formatDate(user?.metadata?.creationTime)}</span>
              </span>
            </div>
          </div>
        </div>
        <button onClick={handleSignOut} style={styles.signOutButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.signOutIcon}>
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("listings")}
          style={{
            ...styles.tab,
            ...(activeTab === "listings" ? styles.tabActive : {})
          }}
        >
          My Listings
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          style={{
            ...styles.tab,
            ...(activeTab === "activity" ? styles.tabActive : {})
          }}
        >
          Activity
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            ...styles.tab,
            ...(activeTab === "settings" ? styles.tabActive : {})
          }}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === "listings" && (
          <div style={styles.listingsSection}>
            {userListings.length > 0 ? (
              <div style={styles.grid}>
                {userListings.map((listing) => (
                  <div key={listing.id} style={styles.listingCard}>
                    <div style={styles.listingImage}>
                      {listing.imageUrls && listing.imageUrls.length > 0 ? (
                        <img 
                          src={listing.imageUrls[0]} 
                          alt={listing.title} 
                          style={styles.listingImageImg}
                        />
                      ) : (
                        <div style={styles.noImage}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V9" stroke="#ccc" strokeWidth="1.5"/>
                            <circle cx="9" cy="9" r="3" stroke="#ccc" strokeWidth="1.5"/>
                            <path d="M21 15L17 11L5 23" stroke="#ccc" strokeWidth="1.5"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div style={styles.listingContent}>
                      <h3 style={styles.listingTitle}>{listing.title}</h3>
                      <p style={styles.listingPrice}>${listing.price}</p>
                      <div style={styles.listingFooter}>
                        <span style={styles.listingCategory}>{listing.category}</span>
                        <span style={styles.listingDate}>{formatDate(listing.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="#cccccc" strokeWidth="1.5"/>
                  <circle cx="8.5" cy="8.5" r="1.5" stroke="#cccccc" strokeWidth="1.5"/>
                  <polyline points="21,15 16,10 5,21" stroke="#cccccc" strokeWidth="1.5"/>
                </svg>
                <h3 style={styles.emptyTitle}>No listings yet</h3>
                <p style={styles.emptyText}>
                  Start selling by posting your first item
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div style={styles.activitySection}>
            <div style={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
                <circle cx="12" cy="12" r="3" stroke="#cccccc" strokeWidth="1.5"/>
                <path d="M12 1V12L15 15" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <h3 style={styles.emptyTitle}>No recent activity</h3>
              <p style={styles.emptyText}>
                Your recent transactions and interactions will appear here
              </p>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div style={styles.settingsSection}>
            <div style={styles.settingsCard}>
              <h3 style={styles.settingsTitle}>Account Settings</h3>
              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <span style={styles.settingLabel}>Email Notifications</span>
                  <span style={styles.settingDescription}>Receive notifications about messages and activity</span>
                </div>
                <label style={styles.toggle}>
                  <input type="checkbox" defaultChecked style={styles.toggleInput} />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>
              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <span style={styles.settingLabel}>Profile Visibility</span>
                  <span style={styles.settingDescription}>Allow other students to see your profile</span>
                </div>
                <label style={styles.toggle}>
                  <input type="checkbox" defaultChecked style={styles.toggleInput} />
                  <span style={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '3rem',
    paddingBottom: '2rem',
    borderBottom: '1px solid #f0f0f0'
  },
  profileInfo: {
    display: 'flex',
    gap: '2rem',
    alignItems: 'flex-start'
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarText: {
    color: '#ffffff',
    fontSize: '2rem',
    fontWeight: '600',
    letterSpacing: '-0.02em'
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  uploadSpinner: {
    width: '24px',
    height: '24px',
    border: '2px solid transparent',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  avatarActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center'
  },
  uploadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: '1px solid #e5e5e5',
    color: '#666666',
    fontSize: '0.75rem',
    fontWeight: '500',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  removeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '0.75rem',
    fontWeight: '500',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  uploadIcon: {
    flexShrink: 0
  },
  removeIcon: {
    flexShrink: 0
  },
  hiddenInput: {
    display: 'none'
  },
  userDetails: {
    flex: 1
  },
  displayName: {
    fontSize: '1.75rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    margin: '0 0 0.25rem 0',
    color: '#000000'
  },
  email: {
    fontSize: '0.9375rem',
    color: '#666666',
    margin: '0 0 1rem 0',
    fontWeight: '400'
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    fontSize: '0.875rem'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem'
  },
  statNumber: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#000000',
    letterSpacing: '-0.02em'
  },
  statLabel: {
    color: '#666666',
    fontWeight: '400'
  },
  statValue: {
    color: '#000000',
    fontWeight: '500'
  },
  statDivider: {
    color: '#cccccc',
    fontSize: '0.75rem'
  },
  signOutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: '1px solid #e5e5e5',
    color: '#666666',
    fontSize: '0.875rem',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  signOutIcon: {
    flexShrink: 0
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: '2rem'
  },
  tab: {
    background: 'none',
    border: 'none',
    padding: '1rem 0',
    marginRight: '2rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: '#666666',
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.2s ease',
    letterSpacing: '-0.01em'
  },
  tabActive: {
    color: '#000000'
  },
  content: {
    minHeight: '400px'
  },
  listingsSection: {
    width: '100%'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1.5rem'
  },
  listingCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  listingImage: {
    width: '100%',
    height: '180px',
    backgroundColor: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid #f0f0f0'
  },
  listingImageImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noImage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#cccccc'
  },
  listingContent: {
    padding: '1rem'
  },
  listingTitle: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    color: '#000000',
    letterSpacing: '-0.01em',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  listingPrice: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '0.75rem',
    letterSpacing: '-0.02em'
  },
  listingFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f5f5f5'
  },
  listingCategory: {
    fontSize: '0.75rem',
    color: '#999999',
    fontWeight: '400'
  },
  listingDate: {
    fontSize: '0.75rem',
    color: '#999999',
    fontWeight: '400'
  },
  activitySection: {
    width: '100%'
  },
  settingsSection: {
    width: '100%'
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    padding: '1.5rem'
  },
  settingsTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '0 0 1.5rem 0',
    color: '#000000',
    letterSpacing: '-0.01em'
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #f5f5f5'
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  settingLabel: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: '#000000',
    letterSpacing: '-0.01em'
  },
  settingDescription: {
    fontSize: '0.8125rem',
    color: '#666666',
    fontWeight: '400'
  },
  toggle: {
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px'
  },
  toggleInput: {
    opacity: 0,
    width: 0,
    height: 0
  },
  toggleSlider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '0.4s',
    borderRadius: '24px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#999999'
  },
  emptyIcon: {
    marginBottom: '1rem'
  },
  emptyTitle: {
    fontSize: '1.125rem',
    fontWeight: '500',
    margin: '0 0 0.5rem 0',
    color: '#666666'
  },
  emptyText: {
    fontSize: '0.9375rem',
    color: '#999999',
    margin: 0,
    lineHeight: '1.5'
  }
};

