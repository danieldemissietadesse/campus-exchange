// src/components/ProfileSection.js
"use client";

import { useState, useRef, useEffect } from "react";
import { auth, db, storage } from "../app/firebaseConfig";
import { 
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { deleteListing, getSavedListings } from '@/lib/api';

export default function ProfileSection({ user, userListings, onListingSelect }) {
  const [activeTab, setActiveTab] = useState("listings");
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [savedListings, setSavedListings] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const fileInputRef = useRef(null);
  const savedListingsLoaded = useRef(false);

  // Initialize dark mode from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      setDarkMode(isDark);
      applyDarkMode(isDark);
    }
  }, []);

  // Apply dark mode to document
  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load user profile image on mount
  useEffect(() => {
    const loadProfileImage = async () => {
      if (!user?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().profileImageUrl) {
          setProfileImage(userDoc.data().profileImageUrl);
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
      }
    };

    loadProfileImage();
  }, [user]);

  // Load saved listings when saved tab is accessed
  useEffect(() => {
    if (activeTab === 'saved' && user?.uid && !savedListingsLoaded.current && !loadingSaved) {
      savedListingsLoaded.current = true; // Set this first to prevent multiple calls
      setLoadingSaved(true);
      
      getSavedListings()
        .then(saved => {
          console.log('Saved listings loaded:', saved);
          setSavedListings(Array.isArray(saved) ? saved : []); // Ensure it's always an array
        })
        .catch(error => {
          console.error('Error loading saved listings:', error);
          savedListingsLoaded.current = false; // Reset on error
          setSavedListings([]); // Set empty array on error
        })
        .finally(() => {
          setLoadingSaved(false);
        });
    }
  }, [activeTab, user?.uid]);

  // Load user settings
  useEffect(() => {
    let cancelled = false;
    
    const loadUserSettings = async () => {
      if (!user?.uid || cancelled) return;
      
      try {
        console.log('Loading user settings...');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (cancelled) return; // Don't update state if component unmounted
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEmailNotifications(userData.emailNotifications ?? true);
          setProfileVisibility(userData.profileVisibility ?? true);
          const userDarkMode = userData.darkMode ?? false;
          setDarkMode(userDarkMode);
          applyDarkMode(userDarkMode);
          localStorage.setItem('darkMode', userDarkMode.toString());
          console.log('User settings loaded:', userData);
        } else {
          console.log('User document does not exist');
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading user settings:', error);
        }
      }
    };

    if (user?.uid) {
      loadUserSettings();
    }

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

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
    if (!file || !user?.uid) return;

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
      // Delete old profile image if it exists
      if (profileImage && profileImage.startsWith('https://storage.googleapis.com')) {
        try {
          const oldImageRef = ref(storage, `profile-images/${user.uid}`);
          await deleteObject(oldImageRef);
        } catch (error) {
          // Ignore error if old image doesn't exist
          console.log('Old profile image not found or already deleted');
        }
      }

      // Upload new image to Firebase Storage
      const imageRef = ref(storage, `profile-images/${user.uid}`);
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Save profile image URL to user document
      await setDoc(doc(db, 'users', user.uid), {
        profileImageUrl: downloadURL,
        email: user.email,
        updatedAt: new Date()
      }, { merge: true });

      setProfileImage(downloadURL);
      console.log('Profile image uploaded successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      let errorMessage = 'Failed to upload image. ';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage += 'Permission denied. Please try signing in again.';
      } else if (error.code === 'storage/canceled') {
        errorMessage += 'Upload was canceled.';
      } else if (error.code === 'storage/unknown') {
        errorMessage += 'An unknown error occurred.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage += 'User authentication error. Please sign in again.';
      } else {
        errorMessage += 'Please check your internet connection and try again.';
        console.error('Full error details:', error);
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const removeProfileImage = async () => {
    if (!user?.uid) return;
    
    try {
      // Delete from Firebase Storage if it exists
      if (profileImage && profileImage.startsWith('https://storage.googleapis.com')) {
        const imageRef = ref(storage, `profile-images/${user.uid}`);
        await deleteObject(imageRef);
      }

      // Remove from user document
      await setDoc(doc(db, 'users', user.uid), {
        profileImageUrl: null,
        email: user.email,
        updatedAt: new Date()
      }, { merge: true });

      setProfileImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing profile image:', error);
      alert('Failed to remove image. Please try again.');
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    setDeleting(listingId);
    try {
      await deleteListing(listingId);
      // Refresh the page or update the listings list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleListingClick = (listing) => {
    if (onListingSelect) {
      onListingSelect(listing);
    } else {
      setSelectedListing(listing);
    }
  };

  const handleSettingsChange = async (setting, value) => {
    if (!user?.uid) return;

    setSavingSettings(true);
    try {
      const settingsUpdate = {
        [setting]: value,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), settingsUpdate, { merge: true });

      // Update local state
      if (setting === 'emailNotifications') {
        setEmailNotifications(value);
      } else if (setting === 'profileVisibility') {
        setProfileVisibility(value);
      } else if (setting === 'darkMode') {
        setDarkMode(value);
        applyDarkMode(value);
        localStorage.setItem('darkMode', value.toString());
      }

      console.log(`${setting} updated to:`, value);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSavingSettings(false);
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
          onClick={() => setActiveTab("saved")}
          style={{
            ...styles.tab,
            ...(activeTab === "saved" ? styles.tabActive : {})
          }}
        >
          Saved
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
                    <div 
                      style={styles.listingClickable}
                      onClick={() => handleListingClick(listing)}
                    >
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
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteListing(listing.id);
                      }}
                      style={styles.deleteButton}
                      disabled={deleting === listing.id}
                    >
                      {deleting === listing.id ? (
                        <span>Deleting...</span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.4477 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19ZM10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
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

        {activeTab === "saved" && (
          <div style={styles.listingsSection}>
            {loadingSaved ? (
              <div style={styles.emptyState}>
                <p>Loading saved listings...</p>
              </div>
            ) : savedListings.length > 0 ? (
              <div style={styles.grid}>
                {savedListings.map((listing) => (
                  <div key={listing.id} style={styles.listingCard}>
                    <div 
                      style={styles.listingClickable}
                      onClick={() => handleListingClick(listing)}
                    >
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
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
                  <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.5783 8.50903 2.9987 7.05 2.9987C5.59096 2.9987 4.19169 3.5783 3.16 4.61C2.1283 5.6417 1.5487 7.04097 1.5487 8.5C1.5487 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.06211 22.0329 6.39467C21.7563 5.72723 21.351 5.1208 20.84 4.61V4.61Z" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h3 style={styles.emptyTitle}>No saved listings</h3>
                <p style={styles.emptyText}>
                  Items you save will appear here for easy access
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div style={styles.activitySection}>
            <div style={styles.activityCard}>
              <h3 style={styles.activityTitle}>📊 Account Overview</h3>
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{userListings.length}</span>
                  <span style={styles.statLabel}>Active Listings</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{savedListings.length}</span>
                  <span style={styles.statLabel}>Saved Items</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>
                    ${userListings.reduce((total, listing) => total + (listing.price || 0), 0)}
                  </span>
                  <span style={styles.statLabel}>Total Listing Value</span>
                </div>
              </div>
            </div>
            
            <div style={styles.activityCard}>
              <h3 style={styles.activityTitle}>📈 Recent Activity</h3>
              <div style={styles.activityList}>
                {userListings.length > 0 ? (
                  userListings.slice(0, 5).map((listing) => (
                    <div key={listing.id} style={styles.activityItem}>
                      <div style={styles.activityIcon}>📦</div>
                      <div style={styles.activityContent}>
                        <p style={styles.activityText}>
                          Listed <strong>{listing.title}</strong> for ${listing.price}
                        </p>
                        <span style={styles.activityTime}>
                          {formatDate(listing.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyActivity}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
                      <circle cx="12" cy="12" r="3" stroke="#cccccc" strokeWidth="1.5"/>
                      <path d="M12 1V12L15 15" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p style={styles.emptyText}>No activity yet</p>
                  </div>
                )}
              </div>
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
                  <input 
                    type="checkbox" 
                    checked={emailNotifications}
                    onChange={(e) => handleSettingsChange('emailNotifications', e.target.checked)}
                    disabled={savingSettings}
                    style={styles.toggleInput} 
                  />
                  <span style={{
                    ...styles.toggleSlider,
                    backgroundColor: emailNotifications ? 'var(--accent-bg)' : '#ccc'
                  }}></span>
                </label>
              </div>
              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <span style={styles.settingLabel}>Profile Visibility</span>
                  <span style={styles.settingDescription}>Allow other students to see your profile</span>
                </div>
                <label style={styles.toggle}>
                  <input 
                    type="checkbox" 
                    checked={profileVisibility}
                    onChange={(e) => handleSettingsChange('profileVisibility', e.target.checked)}
                    disabled={savingSettings}
                    style={styles.toggleInput} 
                  />
                  <span style={{
                    ...styles.toggleSlider,
                    backgroundColor: profileVisibility ? 'var(--accent-bg)' : '#ccc'
                  }}></span>
                </label>
              </div>
              <div style={styles.settingItem}>
                <div style={styles.settingInfo}>
                  <span style={styles.settingLabel}>Dark Mode</span>
                  <span style={styles.settingDescription}>Switch between light and dark themes</span>
                </div>
                <label style={styles.toggle}>
                  <input 
                    type="checkbox" 
                    checked={darkMode}
                    onChange={(e) => handleSettingsChange('darkMode', e.target.checked)}
                    disabled={savingSettings}
                    style={styles.toggleInput} 
                  />
                  <span style={{
                    ...styles.toggleSlider,
                    backgroundColor: darkMode ? 'var(--accent-bg)' : '#ccc'
                  }}></span>
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
    borderBottom: '1px solid var(--border)'
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
    backgroundColor: 'var(--accent-bg)',
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
    color: var(--accent-fg),
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
    borderTop: '2px solid var(--accent-fg)',
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
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
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
    color: 'var(--foreground)'
  },
  email: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
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
    color: 'var(--foreground)',
    letterSpacing: '-0.02em'
  },
  statLabel: {
    color: 'var(--text-secondary)',
    fontWeight: '400'
  },
  statValue: {
    color: 'var(--foreground)',
    fontWeight: '500'
  },
  statDivider: {
    color: 'var(--text-secondary)',
    fontSize: '0.75rem'
  },
  signOutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
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
    borderBottom: '1px solid var(--border)',
    marginBottom: '2rem'
  },
  tab: {
    background: 'none',
    border: 'none',
    padding: '1rem 0',
    marginRight: '2rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.2s ease',
    letterSpacing: '-0.01em'
  },
  tabActive: {
    color: 'var(--foreground)'
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
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column'
  },
  listingImage: {
    width: '100%',
    height: '180px',
    backgroundColor: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid var(--border)'
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
    color: 'var(--text-secondary)'
  },
  listingContent: {
    padding: '1rem'
  },
  listingTitle: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    marginBottom: '0.5rem',
    color: 'var(--foreground)',
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
    color: 'var(--foreground)',
    marginBottom: '0.75rem',
    letterSpacing: '-0.02em'
  },
  listingFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border)'
  },
  listingCategory: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: '400'
  },
  listingDate: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    fontWeight: '400'
  },
  activitySection: {
    width: '100%'
  },
  settingsSection: {
    width: '100%'
  },
  settingsCard: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.5rem'
  },
  settingsTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '0 0 1.5rem 0',
    color: 'var(--foreground)',
    letterSpacing: '-0.01em'
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid var(--border)'
  },
  settingInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  settingLabel: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: 'var(--foreground)',
    letterSpacing: '-0.01em'
  },
  settingDescription: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
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
    color: 'var(--text-secondary)'
  },
  emptyIcon: {
    marginBottom: '1rem'
  },
  emptyTitle: {
    fontSize: '1.125rem',
    fontWeight: '500',
    margin: '0 0 0.5rem 0',
    color: 'var(--text-secondary)'
  },
  emptyText: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    margin: 0,
    lineHeight: '1.5'
  },
  listingClickable: {
    cursor: 'pointer',
    flex: 1
  },
  deleteButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
    color: '#dc2626',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(4px)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  activityCard: {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  },
  activityTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '0 0 1rem 0',
    color: 'var(--foreground)',
    letterSpacing: '-0.01em'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem'
  },
  statItem: {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: 'var(--surface)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  statNumber: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--foreground)',
    letterSpacing: '-0.02em'
  },
  statLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontWeight: '500'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem',
    backgroundColor: 'var(--surface)',
    borderRadius: '8px'
  },
  activityIcon: {
    fontSize: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px'
  },
  activityContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  activityText: {
    fontSize: '0.9375rem',
    color: 'var(--foreground)',
    margin: 0,
    fontWeight: '400'
  },
  activityTime: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    fontWeight: '400'
  },
  emptyActivity: {
    textAlign: 'center',
    padding: '2rem',
    color: 'var(--text-secondary)'
  }
};

