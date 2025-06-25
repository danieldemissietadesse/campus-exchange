"use client";

import { useState, useEffect } from "react";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, reload } from "firebase/auth";
import { streamListings, streamMessages } from "@/lib/api";

// Import separate components
import Auth from "@/components/Auth";
import VerificationPage from "@/components/VerificationPage";
import MessagesList from "@/components/MessagesList";
import ProfileSection from "@/components/ProfileSection";
import PostModal from "@/components/PostModal";
import ListingDetailModal from "@/components/ListingDetailModal";
import MessageModal from "@/components/MessageModal";

export default function HomePage() {
  // Auth state
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(false);

  // Data state
  const [listings, setListings] = useState([]);
  const [messages, setMessages] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const categories = ["All", "Textbooks", "Electronics", "Furniture", "Clothing", "Dorm Supplies", "Other"];

  // Auth effect
  useEffect(() => {
    const off = onAuthStateChanged(auth, async (u) => {
      if (!u) return setUser(null);
      await reload(u);
      setUser(u);
      
      // Special bypass for test user
      if (u.email === 'testuser@wit.edu') {
        console.log('🧪 Test user detected - bypassing email verification');
        setAuthed(true);
      } else {
        setAuthed(u.emailVerified);
      }
    });
    return () => off();
  }, []);

  // Data streams - UPDATED MESSAGING
  useEffect(() => {
    if (!authed) return;
    const unsub = streamListings(setListings);
    return () => unsub();
  }, [authed]);

  useEffect(() => {
    if (!authed || !user?.uid) return;
    
    console.log('Setting up message stream for user:', user.uid);
    const unsub = streamMessages(user.uid, (newMessages) => {
      console.log('Received messages update:', newMessages);
      setMessages(newMessages);
    });
    
    return () => {
      console.log('Cleaning up message stream');
      unsub();
    };
  }, [authed, user?.uid]);

  // Filter listings
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

  const getCategoryIcon = (category) => {
    const icons = {
      "All": "🏪",
      "Textbooks": "📚",
      "Electronics": "💻",
      "Furniture": "🪑",
      "Clothing": "👕",
      "Dorm Supplies": "🏠",
      "Other": "📦"
    };
    return icons[category] || "📦";
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
            <span style={styles.logoIcon}>📦</span>
            <span style={styles.logoText}>Campus Exchange</span>
          </div>
          
          <div style={styles.headerActions}>
            <span style={styles.userEmail}>{user.email}</span>
            
            <button 
              onClick={() => handleViewChange(showMessages ? 'home' : 'messages')}
              style={{
                ...styles.headerButton,
                backgroundColor: showMessages ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              💬 Messages
              {unreadCount > 0 && (
                <span style={styles.badge}>{unreadCount}</span>
              )}
            </button>
            
            <button 
              onClick={() => handleViewChange(showProfile ? 'home' : 'profile')}
              style={{
                ...styles.headerButton,
                backgroundColor: showProfile ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              👤 Profile
            </button>
            
            <button 
              onClick={() => auth.signOut()} 
              style={styles.logoutButton}
            >
              Logout
            </button>
          </div>
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
            {/* Search Section */}
            <div style={styles.searchSection}>
              <div style={styles.searchHeader}>
                <h2 style={styles.searchTitle}>🛍️ WIT Student Marketplace</h2>
                <button 
                  onClick={() => setShowModal(true)}
                  style={styles.postButton}
                  onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ✨ Post New Item
                </button>
              </div>
              
              <div style={styles.searchControls}>
                <div style={styles.searchInputContainer}>
                  <span style={styles.searchIcon}>🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search for textbooks, furniture, electronics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      style={styles.clearButton}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              
              <div style={styles.categories}>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      ...styles.categoryChip,
                      ...(selectedCategory === category ? styles.activeCategoryChip : {})
                    }}
                  >
                    {getCategoryIcon(category)} {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Listings Grid */}
            <div style={styles.listingsSection}>
              <h3 style={styles.listingsTitle}>
                {selectedCategory === "All" ? "All Items" : selectedCategory} 
                <span style={styles.listingsCount}>({filteredListings.length})</span>
              </h3>
              
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
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      <div style={styles.cardImage}>
                        {listing.imageUrls && listing.imageUrls.length > 0 ? (
                          <>
                            <img 
                              src={listing.imageUrls[0]} 
                              alt={listing.title} 
                              style={styles.cardImageImg}
                            />
                            {listing.imageUrls.length > 1 && (
                              <div style={styles.imageCount}>
                                +{listing.imageUrls.length - 1} more
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={styles.noImage}>
                            <span style={styles.noImageIcon}>📷</span>
                            <span style={styles.noImageText}>No Image</span>
                          </div>
                        )}
                      </div>
                      
                      <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle}>{listing.title}</h3>
                        <p style={styles.cardPrice}>${listing.price}</p>
                        
                        <div style={styles.cardMeta}>
                          <span style={styles.cardCategory}>
                            {getCategoryIcon(listing.category)} {listing.category}
                          </span>
                          <span style={styles.cardDate}>
                            {formatDate(listing.createdAt)}
                          </span>
                        </div>
                        
                        <div style={styles.cardFooter}>
                          <span style={styles.sellerInfo}>
                            By {listing.userEmail?.split('@')[0]}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <span style={styles.emptyIcon}>🔍</span>
                  <h3 style={styles.emptyTitle}>No items found</h3>
                  <p style={styles.emptyText}>
                    Try adjusting your search or browse different categories
                  </p>
                  <p style={styles.emptySubtext}>
                    Be the first to post in this category!
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

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerMain}>
            <div style={styles.footerBrand}>
              <span style={styles.footerLogo}>📦</span>
              <span style={styles.footerTitle}>Campus Exchange</span>
            </div>
            <p style={styles.footerDescription}>
              WIT's exclusive student marketplace for buying and selling items safely within our verified community.
            </p>
          </div>
          
          <div style={styles.footerBottom}>
            <p style={styles.copyright}>
              © 2025 Campus Exchange • A WIT Student Initiative
            </p>
            <p style={styles.disclaimer}>
              Exclusively for WIT students with verified @wit.edu emails
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    color: '#1a202c'
  },
  header: {
    background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
    color: 'white',
    padding: '1rem 2rem',
    boxShadow: '0 4px 12px rgba(0, 51, 102, 0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.5rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  logoIcon: {
    fontSize: '2rem'
  },
  logoText: {
    letterSpacing: '-0.025em'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  userEmail: {
    fontSize: '0.875rem',
    opacity: 0.9,
    fontWeight: '500'
  },
  headerButton: {
    background: 'none',
    border: '2px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  logoutButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '2px solid rgba(239, 68, 68, 0.3)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  badge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold'
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
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  searchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  searchTitle: {
    fontSize: '1.75rem',
    fontWeight: '700',
    margin: 0,
    color: '#1a202c',
    background: 'linear-gradient(135deg, #003366 0%, #10b981 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  postButton: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '0.875rem 1.75rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  searchControls: {
    marginBottom: '1.5rem'
  },
  searchInputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  searchIcon: {
    position: 'absolute',
    left: '1rem',
    fontSize: '1.125rem',
    color: '#64748b',
    zIndex: 1
  },
  searchInput: {
    width: '100%',
    padding: '1rem 1.25rem 1rem 3rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '1rem',
    color: '#1a202c',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s',
    outline: 'none'
  },
  clearButton: {
    position: 'absolute',
    right: '1rem',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    transition: 'all 0.2s'
  },
  categories: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  categoryChip: {
    padding: '0.625rem 1.25rem',
    backgroundColor: '#f1f5f9',
    border: '2px solid #e2e8f0',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  activeCategoryChip: {
    backgroundColor: '#003366',
    color: 'white',
    borderColor: '#003366',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 51, 102, 0.25)'
  },
  listingsSection: {
    marginTop: '1rem'
  },
  listingsTitle: {
    fontSize: '1.375rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#1a202c',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  listingsCount: {
    fontSize: '1rem',
    fontWeight: '400',
    color: '#64748b'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  cardImageImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  imageCount: {
    position: 'absolute',
    bottom: '0.75rem',
    right: '0.75rem',
    backgroundColor: 'rgba(0,0,0,0.75)',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  noImage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#94a3b8'
  },
  noImageIcon: {
    fontSize: '2rem'
  },
  noImageText: {
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  cardContent: {
    padding: '1.25rem'
  },
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#1a202c',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  cardPrice: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#10b981',
    marginBottom: '0.75rem'
  },
  cardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    marginBottom: '0.75rem'
  },
  cardCategory: {
    fontWeight: '500',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  cardDate: {
    color: '#64748b',
    fontStyle: 'italic'
  },
  cardFooter: {
    paddingTop: '0.75rem',
    borderTop: '1px solid #f1f5f9'
  },
  sellerInfo: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    color: '#64748b'
  },
  emptyIcon: {
    fontSize: '4rem',
    display: 'block',
    marginBottom: '1rem'
  },
  emptyTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#374151'
  },
  emptyText: {
    fontSize: '1rem',
    marginBottom: '0.5rem'
  },
  emptySubtext: {
    fontSize: '0.875rem',
    fontStyle: 'italic'
  },
  footer: {
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    marginTop: 'auto'
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  footerMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  footerLogo: {
    fontSize: '1.5rem'
  },
  footerTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1a202c'
  },
  footerDescription: {
    color: '#64748b',
    lineHeight: '1.6',
    fontSize: '0.875rem'
  },
  footerBottom: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1.5rem',
    textAlign: 'center'
  },
  copyright: {
    fontSize: '0.875rem',
    color: '#374151',
    margin: 0,
    marginBottom: '0.25rem'
  },
  disclaimer: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: 0
  }
};