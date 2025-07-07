// src/app/page.js
"use client";

import { useState, useEffect } from "react";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, reload } from "firebase/auth";
import { streamListings, streamMessages } from "@/lib/api";

// Import components (these will also need updating)
import Auth from "@/components/Auth";
import VerificationPage from "@/components/VerificationPage";
import MessagesList from "@/components/MessagesList";
import ProfileSection from "@/components/ProfileSection";
import PostModal from "@/components/PostModal";
import ListingDetailModal from "@/components/ListingDetailModal";
import MessageModal from "@/components/MessageModal";

export default function HomePage() {
  // [State management remains the same]
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(false);
  const [listings, setListings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const categories = ["All", "Textbooks", "Electronics", "Furniture", "Clothing", "Dorm Supplies", "Other"];

  // [All useEffects remain the same]
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) return setUser(null);
      await reload(u);
      setUser(u);
      
      const testUsers = [
        'testuser@wit.edu',
        'testbuyer@wit.edu', 
        'testseller@wit.edu',
        'testuser1@wit.edu',
        'testuser2@wit.edu',
        'demissied@wit.edu'
      ];
      
      if (testUsers.includes(u.email)) {
        console.log('🧪 Test user detected - bypassing email verification:', u.email);
        setAuthed(true);
      } else {
        setAuthed(u.emailVerified);
      }
    });
    return () => off();
  }, []);

  useEffect(() => {
    if (!authed) return;
    const unsub = streamListings(setListings);
    return () => unsub();
  }, [authed]);

  useEffect(() => {
    if (!authed || !user?.uid) {
      console.log('⏭️ Skipping message stream setup - user not ready:', { authed, uid: user?.uid });
      return;
    }
    
    console.log('🚀 Setting up message stream for user:', user.uid);
    
    const handleMessageUpdate = (newMessages) => {
      console.log('📨 Message update received:', newMessages.length, 'messages');
      setMessages(newMessages);
    };
    
    const unsub = streamMessages(user.uid, handleMessageUpdate);
    
    return () => {
      console.log('🧹 Cleaning up message stream for user:', user.uid);
      if (unsub) {
        unsub();
      }
    };
  }, [authed, user?.uid]);

  useEffect(() => {
    console.log(`📊 Messages state updated: ${messages.length} total messages`);
    const unreadCount = messages.filter(m => !m.read && m.recipientId === user?.uid).length;
    console.log(`📬 Unread messages: ${unreadCount}`);
  }, [messages, user?.uid]);

  useEffect(() => {
    let filtered = listings;
    
    if (selectedCategory !== "All") {
      filtered = filtered.filter(listing => listing.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(query) ||
        listing.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredListings(filtered);
  }, [listings, selectedCategory, searchQuery]);

  // Computed values
  const unreadCount = messages.filter((m) => !m.read && m.recipientId === user?.uid).length;
  const userListings = listings.filter(listing => listing.userId === user?.uid);

  // Handlers
  const handleViewChange = (view) => {
    setShowProfile(view === 'profile');
    setShowMessages(view === 'messages');
    if (view === 'home') {
      setShowProfile(false);
      setShowMessages(false);
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
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Render gates
  if (!user) return <Auth onAuth={() => {}} />;
  if (!authed) return <VerificationPage user={user} />;

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div 
            style={styles.logo}
            onClick={() => handleViewChange('home')}
          >
            <span style={styles.logoText}>Campus Exchange</span>
          </div>
          
          <nav style={styles.nav}>
            <button 
              onClick={() => handleViewChange(showMessages ? 'home' : 'messages')}
              style={{
                ...styles.navButton,
                ...(showMessages ? styles.navButtonActive : {})
              }}
            >
              Messages
              {unreadCount > 0 && (
                <span style={styles.badge}>{unreadCount}</span>
              )}
            </button>
            
            <button 
              onClick={() => handleViewChange(showProfile ? 'home' : 'profile')}
              style={{
                ...styles.navButton,
                ...(showProfile ? styles.navButtonActive : {})
              }}
            >
              Profile
            </button>
            
            <span className="user-email" style={styles.userEmail}>{user.email}</span>
            
            <button 
              onClick={() => auth.signOut()} 
              style={styles.signOutButton}
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <main style={styles.main}>
        {/* Messages View */}
        {showMessages && (
          <MessagesList 
            messages={messages}
            currentUserId={user.uid}
          />
        )}

        {/* Profile View */}
        {showProfile && (
          <ProfileSection 
            user={user}
            userListings={userListings}
          />
        )}

        {/* Main Marketplace View */}
        {!showMessages && !showProfile && (
          <>
            {/* Hero Section */}
            <div style={styles.hero}>
              <h1 style={styles.heroTitle}>WIT Student Marketplace</h1>
              <p style={styles.heroSubtitle}>Buy and sell with your campus community</p>
              
              {/* Search Bar */}
              <div style={styles.searchContainer}>
                <input 
                  type="text" 
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={styles.searchInput}
                />
                <svg style={styles.searchIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="#999" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              
              <button 
                onClick={() => setShowModal(true)}
                style={styles.postButton}
              >
                Post New Item
              </button>
            </div>

            {/* Categories */}
            <div style={styles.categoriesSection}>
              <div style={styles.categories}>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      ...styles.categoryPill,
                      ...(selectedCategory === category ? styles.categoryPillActive : {})
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Listings Grid */}
            <div style={styles.listingsSection}>
              <div style={styles.listingsHeader}>
                <h2 style={styles.listingsTitle}>
                  {selectedCategory === "All" ? "All Items" : selectedCategory}
                </h2>
                <span style={styles.listingsCount}>{filteredListings.length} items</span>
              </div>
              
              {filteredListings.length > 0 ? (
                <div style={styles.grid}>
                  {filteredListings.map((listing) => (
                    <div 
                      key={listing.id} 
                      style={styles.card}
                      onClick={() => {
                        setSelectedListing(listing);
                        setShowMessageModal(false);
                      }}
                    >
                      <div style={styles.cardImage}>
                        {listing.imageUrls && listing.imageUrls.length > 0 ? (
                          <img 
                            src={listing.imageUrls[0]} 
                            alt={listing.title} 
                            style={styles.cardImageImg}
                          />
                        ) : (
                          <div style={styles.noImage}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                              <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V9" stroke="#ccc" strokeWidth="1.5"/>
                              <circle cx="9" cy="9" r="3" stroke="#ccc" strokeWidth="1.5"/>
                              <path d="M21 15L17 11L5 23" stroke="#ccc" strokeWidth="1.5"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}>{listing.title}</h3>
                        <p style={styles.cardPrice}>${listing.price}</p>
                        <div style={styles.cardFooter}>
                          <span style={styles.cardMeta}>{listing.category}</span>
                          <span style={styles.cardMeta}>{formatDate(listing.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M11 6L13 6M11 12L13 12M11 18L13 18" stroke="#ccc" strokeWidth="2" strokeLinecap="round"/>
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ccc" strokeWidth="1.5"/>
                  </svg>
                  <h3 style={styles.emptyTitle}>No items found</h3>
                  <p style={styles.emptyText}>
                    Try adjusting your filters or be the first to post
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Modals */}
      {showModal && (
        <PostModal 
          user={user}
          onClose={() => setShowModal(false)}
        />
      )}

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          currentUser={user}
          onClose={() => setSelectedListing(null)}
          onMessageClick={() => setShowMessageModal(true)}
        />
      )}

      {showMessageModal && selectedListing && (
        <MessageModal
          listing={selectedListing}
          currentUser={user}
          onClose={() => setShowMessageModal(false)}
        />
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .user-email {
            display: none;
          }
          header, nav button, .logoText {
            font-size: 0.875rem !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
    color: '#000000'
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.85)'
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    cursor: 'pointer'
  },
  logoText: {
    fontSize: '1.125rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    color: '#000000'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem'
  },
  navButton: {
    background: 'none',
    border: 'none',
    color: '#666666',
    fontSize: '0.9375rem',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '0.5rem 0',
    position: 'relative',
    transition: 'color 0.2s ease',
    letterSpacing: '-0.01em'
  },
  navButtonActive: {
    color: '#000000'
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '0.6875rem',
    fontWeight: '600',
    minWidth: '18px',
    textAlign: 'center'
  },
  userEmail: {
    fontSize: '0.875rem',
    color: '#666666',
    fontWeight: '400'
  },
  signOutButton: {
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
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem'
  },
  hero: {
    textAlign: 'center',
    padding: '4rem 0',
    borderBottom: '1px solid #f0f0f0'
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '700',
    letterSpacing: '-0.03em',
    margin: '0 0 0.5rem 0',
    color: '#000000'
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#666666',
    margin: '0 0 3rem 0',
    fontWeight: '400'
  },
  searchContainer: {
    position: 'relative',
    maxWidth: '500px',
    margin: '0 auto 2rem'
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    fontSize: '1rem',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
    backgroundColor: '#f8f8f8',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontWeight: '400'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none'
  },
  postButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    padding: '0.875rem 2rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    letterSpacing: '-0.01em'
  },
  categoriesSection: {
    padding: '2rem 0',
    borderBottom: '1px solid #f0f0f0'
  },
  categories: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  categoryPill: {
    background: 'none',
    border: '1px solid #e5e5e5',
    color: '#666666',
    padding: '0.5rem 1.25rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '-0.01em'
  },
  categoryPillActive: {
    backgroundColor: '#000000',
    color: '#ffffff',
    borderColor: '#000000'
  },
  listingsSection: {
    padding: '3rem 0 4rem'
  },
  listingsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '2rem'
  },
  listingsTitle: {
    fontSize: '1.75rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    margin: 0,
    color: '#000000'
  },
  listingsCount: {
    fontSize: '0.9375rem',
    color: '#999999',
    fontWeight: '400'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  cardImage: {
    width: '100%',
    height: '240px',
    backgroundColor: '#fafafa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid #f0f0f0'
  },
  cardImageImg: {
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
  cardContent: {
    padding: '1.25rem'
  },
  cardTitle: {
    fontSize: '1rem',
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
  cardPrice: {
    fontSize: '1.375rem',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '0.75rem',
    letterSpacing: '-0.02em'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f5f5f5'
  },
  cardMeta: {
    fontSize: '0.8125rem',
    color: '#999999',
    fontWeight: '400'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#999999'
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '500',
    margin: '1rem 0 0.5rem',
    color: '#666666'
  },
  emptyText: {
    fontSize: '0.9375rem',
    color: '#999999',
    margin: 0
  }
};