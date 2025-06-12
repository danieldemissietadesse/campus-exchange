'use client';

import { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, sendEmailVerification, reload } from 'firebase/auth';
import Auth from '@/components/Auth';
import MessageConversation from '@/components/MessageConversation';
import { createListing, getListings, deleteListing, sendMessage, getMessages, markMessageAsRead } from '@/lib/db';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [messages, setMessages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    contactMethod: 'message'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Always reload user to get latest verification status
        await reload(user);
        setUser(user);
        
        // Only load data if email is verified
        if (user.emailVerified) {
          loadListings();
          loadMessages(user.uid);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Update filtered listings when listings or filters change
  useEffect(() => {
    filterListings(searchTerm, selectedCategory);
  }, [listings]);

  const loadListings = async () => {
    try {
      const data = await getListings();
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const loadMessages = async (userId) => {
    try {
      const data = await getMessages(userId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Combined filter function
  const filterListings = (searchTerm, category) => {
    let filtered = listings;
    
    // Filter by search term if present
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(listing => {
        return (
          listing.title.toLowerCase().includes(searchLower) ||
          listing.description.toLowerCase().includes(searchLower) ||
          listing.category.toLowerCase().includes(searchLower) ||
          listing.userEmail.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Filter by category if not "All"
    if (category !== 'All') {
      filtered = filtered.filter(listing => listing.category === category);
    }
    
    setFilteredListings(filtered);
  };

  // Search handler function
  const handleSearch = (term) => {
    setSearchTerm(term);
    filterListings(term, selectedCategory);
  };

  // Category selection handler
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    filterListings(searchTerm, category);
  };

  // Email Verification Screen Component
  const EmailVerificationScreen = () => {
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const handleResendVerification = async () => {
      setResendLoading(true);
      setResendMessage('');
      
      try {
        await sendEmailVerification(user, {
          url: 'http://localhost:3001' // Add your app URL here
        });
        setResendMessage('Verification email sent! Please check your inbox.');
      } catch (error) {
        if (error.code === 'auth/too-many-requests') {
          setResendMessage('Too many requests. Please wait a few minutes before trying again.');
        } else {
          setResendMessage('Error sending email. Please try again later.');
        }
      } finally {
        setResendLoading(false);
      }
    };

    const handleRefresh = async () => {
      setCheckingVerification(true);
      try {
        // Force refresh the user's token to get updated email verification status
        await user.reload();
        const currentUser = auth.currentUser;
        
        if (currentUser && currentUser.emailVerified) {
          // Refresh the page to reload everything with verified status
          window.location.reload();
        } else {
          alert('Email not verified yet. Please check your inbox and click the verification link.');
        }
      } catch (error) {
        console.error('Error checking verification:', error);
        alert('Error checking verification status. Please try again.');
      } finally {
        setCheckingVerification(false);
      }
    };

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
          maxWidth: '500px',
          width: '100%',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 'bold', 
            color: '#111827', 
            marginBottom: '1rem' 
          }}>
            Verify Your Email
          </h2>
          
          <p style={{ 
            color: '#6b7280', 
            marginBottom: '1.5rem',
            lineHeight: '1.6'
          }}>
            We've sent a verification email to:
          </p>
          
          <p style={{ 
            fontWeight: '600', 
            color: '#003366', 
            marginBottom: '2rem',
            fontSize: '1.125rem'
          }}>
            {user.email}
          </p>
          
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <p style={{ 
              color: '#92400e', 
              fontSize: '0.875rem',
              margin: 0
            }}>
              ⚠️ You must verify your email before you can post or message on Campus Exchange.
            </p>
          </div>

          <div style={{
            backgroundColor: '#e0f2fe',
            border: '1px solid #7dd3fc',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <p style={{ 
              color: '#075985', 
              fontSize: '0.875rem',
              margin: 0,
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              💡 WIT Email Tip:
            </p>
            <p style={{ 
              color: '#075985', 
              fontSize: '0.875rem',
              margin: 0,
              lineHeight: '1.4'
            }}>
              If you see "This link is being scanned" in Outlook, wait a moment and click "Skip and go to link" when it appears. This is WIT's security system checking the link.
            </p>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={handleRefresh}
              disabled={checkingVerification}
              style={{
                padding: '0.875rem',
                backgroundColor: '#003366',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: checkingVerification ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: checkingVerification ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!checkingVerification) {
                  e.target.style.backgroundColor = '#002244';
                }
              }}
              onMouseOut={(e) => e.target.style.backgroundColor = '#003366'}
            >
              {checkingVerification ? 'Checking...' : "I've Verified My Email"}
            </button>
            
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{
                padding: '0.875rem',
                backgroundColor: 'white',
                color: '#003366',
                border: '2px solid #003366',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: resendLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: resendLoading ? 0.6 : 1
              }}
              onMouseOver={(e) => {
                if (!resendLoading) {
                  e.target.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
            >
              {resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>

          {resendMessage && (
            <p style={{
              color: resendMessage.includes('sent') ? '#10b981' : '#ef4444',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {resendMessage}
            </p>
          )}

          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '1.5rem',
            marginTop: '1.5rem'
          }}>
            <p style={{ 
              color: '#6b7280', 
              fontSize: '0.875rem',
              marginBottom: '0.5rem'
            }}>
              Can't find the email? Check your spam/junk folder.
            </p>
            <button
              onClick={() => auth.signOut()}
              style={{
                color: '#6b7280',
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Sign out and try a different email
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Group messages by conversation (by listing and other user)
  const getConversations = () => {
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const isReceived = message.type === 'received';
      const otherUserId = isReceived ? message.senderId : message.recipientId;
      const otherUserEmail = isReceived ? message.senderEmail : message.recipientEmail;
      const key = `${message.listingId}-${otherUserId}`;
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          listingId: message.listingId,
          listingTitle: message.listingTitle,
          otherUserId,
          otherUserEmail,
          messages: [],
          lastMessage: message,
          unreadCount: 0
        });
      }
      
      const conversation = conversationMap.get(key);
      conversation.messages.push(message);
      
      // Update last message if this one is more recent
      if (!conversation.lastMessage.createdAt || 
          (message.createdAt && message.createdAt.seconds > conversation.lastMessage.createdAt.seconds)) {
        conversation.lastMessage = message;
      }
      
      // Count unread messages
      if (isReceived && !message.read) {
        conversation.unreadCount++;
      }
    });
    
    // Convert to array and sort by last message time
    return Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = a.lastMessage.createdAt?.seconds || 0;
      const bTime = b.lastMessage.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      alert('You can only upload up to 5 images');
      return;
    }

    const newFiles = [...imageFiles, ...files.slice(0, 5 - imageFiles.length)];
    setImageFiles(newFiles);

    // Create previews
    const newPreviews = [];
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === newFiles.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createListing({
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        price: parseFloat(formData.price)
      }, imageFiles);
      
      await loadListings();
      setShowModal(false);
      setFormData({ title: '', category: '', price: '', description: '', contactMethod: 'message' });
      setImageFiles([]);
      setImagePreviews([]);
      alert('Item posted successfully!');
    } catch (error) {
      alert('Error posting item: ' + error.message);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    try {
      await sendMessage({
        senderId: user.uid,
        senderEmail: user.email,
        recipientId: selectedListing.userId,
        recipientEmail: selectedListing.userEmail,
        listingId: selectedListing.id,
        listingTitle: selectedListing.title,
        message: messageText
      });
      
      setMessageText('');
      setShowMessageModal(false);
      alert('Message sent successfully!');
    } catch (error) {
      alert('Error sending message: ' + error.message);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteListing(listingId);
        await loadListings();
        setSelectedListing(null);
      } catch (error) {
        alert('Error deleting listing: ' + error.message);
      }
    }
  };

  const handleConversationClick = async (conversation) => {
    // Mark all messages in this conversation as read
    const unreadMessages = conversation.messages.filter(m => m.type === 'received' && !m.read);
    for (const msg of unreadMessages) {
      await markMessageAsRead(msg.id);
    }
    await loadMessages(user.uid);
    
    setSelectedConversation(conversation);
  };

  const unreadCount = messages.filter(m => m.type === 'received' && !m.read).length;
  const conversations = getConversations();

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

  // Check email verification - strict check
  if (user && !user.emailVerified) {
    return <EmailVerificationScreen />;
  }

  const userListings = listings.filter(listing => listing.userId === user.uid);

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
    profileButton: {
      background: 'none',
      border: '2px solid white',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s'
    },
    messagesButton: {
      background: 'none',
      border: '2px solid white',
      color: 'white',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s',
      position: 'relative'
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
      fontSize: '1rem',
      color: '#000000'
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
      color: '#9ca3af',
      position: 'relative',
      overflow: 'hidden'
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
      zIndex: 1000,
      padding: '1rem'
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      width: '90%',
      maxWidth: '600px',
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
      fontSize: '1rem',
      color: '#000000',
      backgroundColor: '#ffffff'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '1rem',
      backgroundColor: 'white',
      color: '#000000'
    },
    textarea: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      fontSize: '1rem',
      minHeight: '100px',
      resize: 'vertical',
      color: '#000000',
      backgroundColor: '#ffffff'
    },
    imageUpload: {
      border: '2px dashed #e5e7eb',
      borderRadius: '6px',
      padding: '2rem',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative'
    },
    imagePreviewContainer: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '1rem',
      flexWrap: 'wrap'
    },
    imagePreview: {
      position: 'relative',
      width: '100px',
      height: '100px',
      borderRadius: '6px',
      overflow: 'hidden'
    },
    removeImageButton: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '24px',
      height: '24px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1rem'
    },
    profileSection: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    messagesSection: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    conversationItem: {
      padding: '1rem',
      borderBottom: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    conversationInfo: {
      flex: 1
    },
    conversationHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.25rem'
    },
    conversationTitle: {
      fontWeight: '600',
      color: '#111827',
      fontSize: '1rem'
    },
    conversationTime: {
      fontSize: '0.75rem',
      color: '#9ca3af'
    },
    conversationParticipant: {
      fontSize: '0.875rem',
      color: '#6b7280',
      marginBottom: '0.25rem'
    },
    conversationLastMessage: {
      fontSize: '0.875rem',
      color: '#4b5563',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '400px'
    },
    unreadBadge: {
      backgroundColor: '#10b981',
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      marginLeft: '1rem'
    },
    imageSlider: {
      position: 'relative',
      width: '100%',
      height: '400px',
      backgroundColor: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    },
    sliderButton: {
      position: 'absolute',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: 'rgba(0,0,0,0.5)',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem',
      zIndex: 2
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
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,0.5)',
      cursor: 'pointer'
    },
    activeIndicator: {
      backgroundColor: 'white'
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>📦 Campus Exchange</h1>
          <div style={styles.userInfo}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              {user.email}
              {user.emailVerified && (
                <span style={{ 
                  color: '#10b981', 
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span style={{ fontSize: '1rem' }}>✓</span>
                  Verified
                </span>
              )}
            </span>
            <button 
              onClick={() => {
                setShowMessages(!showMessages);
                setShowProfile(false);
                setSelectedConversation(null);
              }}
              style={styles.messagesButton}
            >
              Messages
              {unreadCount > 0 && (
                <span style={styles.badge}>{unreadCount}</span>
              )}
            </button>
            <button 
              onClick={() => {
                setShowProfile(!showProfile);
                setShowMessages(false);
                setSelectedConversation(null);
              }}
              style={styles.profileButton}
            >
              My Profile
            </button>
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
        {/* Messages Section */}
        {showMessages && !selectedConversation && (
          <div style={styles.messagesSection}>
            <h2 style={{ marginBottom: '1rem', color: '#111827' }}>My Messages</h2>
            {conversations.length > 0 ? (
              <div>
                {conversations.map((conversation, index) => (
                  <div 
                    key={index} 
                    style={{
                      ...styles.conversationItem,
                      backgroundColor: conversation.unreadCount > 0 ? '#f0fdf4' : 'transparent'
                    }}
                    onClick={() => handleConversationClick(conversation)}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = conversation.unreadCount > 0 ? '#f0fdf4' : 'transparent'}
                  >
                    <div style={styles.conversationInfo}>
                      <div style={styles.conversationHeader}>
                        <div style={styles.conversationTitle}>{conversation.listingTitle}</div>
                        <div style={styles.conversationTime}>
                          {formatMessageTime(conversation.lastMessage.createdAt)}
                        </div>
                      </div>
                      <div style={styles.conversationParticipant}>
                        {conversation.otherUserEmail}
                      </div>
                      <div style={styles.conversationLastMessage}>
                        {conversation.lastMessage.type === 'sent' && 'You: '}
                        {conversation.lastMessage.message}
                      </div>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div style={styles.unreadBadge}>{conversation.unreadCount}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>No messages yet</p>
            )}
          </div>
        )}

        {/* Show conversation view if selected */}
        {showMessages && selectedConversation && (
          <MessageConversation 
            conversation={selectedConversation}
            onBack={() => {
              setSelectedConversation(null);
              loadMessages(user.uid);
            }}
          />
        )}

        {/* Profile Section */}
        {showProfile && (
          <div style={styles.profileSection}>
            <h2 style={{ marginBottom: '1rem', color: '#111827' }}>My Profile</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Member Since:</strong> {new Date(user.metadata.creationTime).toLocaleDateString()}</p>
            <p><strong>My Listings:</strong> {userListings.length} items</p>
            
            {userListings.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>My Active Listings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {userListings.map(listing => (
                    <div key={listing.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '0.75rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px'
                    }}>
                      <span>{listing.title} - ${listing.price}</span>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        style={{ ...styles.button, ...styles.dangerButton, padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Only show search and listings if not viewing messages or profile */}
        {!showMessages && !showProfile && (
          <>
            {/* Search Section */}
            <div style={styles.searchSection}>
              <div style={styles.searchBar}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                    type="text" 
                    placeholder="Search for textbooks, furniture, electronics..."
                    style={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => handleSearch('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '0.25rem'
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setShowModal(true)}
                  style={{...styles.button, ...styles.primaryButton}}
                >
                  + Post New Item
                </button>
              </div>
              
              <div style={styles.categories}>
                <div 
                  style={{
                    ...styles.categoryChip,
                    backgroundColor: selectedCategory === 'All' ? '#003366' : '#f3f4f6',
                    color: selectedCategory === 'All' ? 'white' : '#374151',
                    border: selectedCategory === 'All' ? '1px solid #003366' : '1px solid #e5e7eb'
                  }}
                  onClick={() => handleCategorySelect('All')}
                  onMouseOver={(e) => {
                    if (selectedCategory !== 'All') {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== 'All') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  📚 All Categories
                </div>
                <div 
                  style={{
                    ...styles.categoryChip,
                    backgroundColor: selectedCategory === 'Textbooks' ? '#003366' : '#f3f4f6',
                    color: selectedCategory === 'Textbooks' ? 'white' : '#374151',
                    border: selectedCategory === 'Textbooks' ? '1px solid #003366' : '1px solid #e5e7eb'
                  }}
                  onClick={() => handleCategorySelect('Textbooks')}
                  onMouseOver={(e) => {
                    if (selectedCategory !== 'Textbooks') {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== 'Textbooks') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  📖 Textbooks
                </div>
                <div 
                  style={{
                    ...styles.categoryChip,
                    backgroundColor: selectedCategory === 'Electronics' ? '#003366' : '#f3f4f6',
                    color: selectedCategory === 'Electronics' ? 'white' : '#374151',
                    border: selectedCategory === 'Electronics' ? '1px solid #003366' : '1px solid #e5e7eb'
                  }}
                  onClick={() => handleCategorySelect('Electronics')}
                  onMouseOver={(e) => {
                    if (selectedCategory !== 'Electronics') {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== 'Electronics') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  💻 Electronics
                </div>
                <div 
                  style={{
                    ...styles.categoryChip,
                    backgroundColor: selectedCategory === 'Furniture' ? '#003366' : '#f3f4f6',
                    color: selectedCategory === 'Furniture' ? 'white' : '#374151',
                    border: selectedCategory === 'Furniture' ? '1px solid #003366' : '1px solid #e5e7eb'
                  }}
                  onClick={() => handleCategorySelect('Furniture')}
                  onMouseOver={(e) => {
                    if (selectedCategory !== 'Furniture') {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== 'Furniture') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  🪑 Furniture
                </div>
                <div 
                  style={{
                    ...styles.categoryChip,
                    backgroundColor: selectedCategory === 'Clothing' ? '#003366' : '#f3f4f6',
                    color: selectedCategory === 'Clothing' ? 'white' : '#374151',
                    border: selectedCategory === 'Clothing' ? '1px solid #003366' : '1px solid #e5e7eb'
                  }}
                  onClick={() => handleCategorySelect('Clothing')}
                  onMouseOver={(e) => {
                    if (selectedCategory !== 'Clothing') {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== 'Clothing') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  👕 Clothing
                </div>
                <div 
                  style={{
                    ...styles.categoryChip,
                    backgroundColor: selectedCategory === 'Dorm Supplies' ? '#003366' : '#f3f4f6',
                    color: selectedCategory === 'Dorm Supplies' ? 'white' : '#374151',
                    border: selectedCategory === 'Dorm Supplies' ? '1px solid #003366' : '1px solid #e5e7eb'
                  }}
                  onClick={() => handleCategorySelect('Dorm Supplies')}
                  onMouseOver={(e) => {
                    if (selectedCategory !== 'Dorm Supplies') {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== 'Dorm Supplies') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  🏠 Dorm Supplies
                </div>
                <div 
                  style={{
                    ...styles.categoryChip,
                    backgroundColor: selectedCategory === 'Other' ? '#003366' : '#f3f4f6',
                    color: selectedCategory === 'Other' ? 'white' : '#374151',
                    border: selectedCategory === 'Other' ? '1px solid #003366' : '1px solid #e5e7eb'
                  }}
                  onClick={() => handleCategorySelect('Other')}
                  onMouseOver={(e) => {
                    if (selectedCategory !== 'Other') {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedCategory !== 'Other') {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  📦 Other
                </div>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  handleSearch('');
                  handleCategorySelect('All');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  marginBottom: '1rem',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: '#374151',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                Clear all filters
              </button>
            )}

            {/* Search Results Counter */}
            {(searchTerm || selectedCategory !== 'All') && (
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.875rem', 
                marginTop: '-0.5rem',
                marginBottom: '1rem'
              }}>
                Found {filteredListings.length} {filteredListings.length === 1 ? 'result' : 'results'}
                {searchTerm && ` for "${searchTerm}"`}
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              </p>
            )}

            {/* Listings Grid */}
            <h2 style={{ marginBottom: '1rem', color: '#111827' }}>
              {selectedCategory === 'All' ? 'Recent Listings' : `${selectedCategory}`}
            </h2>
            <div style={styles.grid}>
              {filteredListings.length > 0 ? (
                filteredListings.map((listing) => (
                  <div 
                    key={listing.id} 
                    style={styles.card}
                    onClick={() => {
                      setSelectedListing(listing);
                      setCurrentImageIndex(0);
                    }}
                  >
                    <div style={styles.cardImage}>
                      {listing.imageUrls && listing.imageUrls.length > 0 ? (
                        <img 
                          src={listing.imageUrls[0]} 
                          alt={listing.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : listing.imageUrl ? (
                        <img 
                          src={listing.imageUrl} 
                          alt={listing.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <span>No Image</span>
                      )}
                      {listing.imageUrls && listing.imageUrls.length > 1 && (
                        <div style={{ 
                          position: 'absolute', 
                          bottom: '0.5rem', 
                          right: '0.5rem', 
                          backgroundColor: 'rgba(0,0,0,0.7)', 
                          color: 'white', 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}>
                          +{listing.imageUrls.length - 1} more
                        </div>
                      )}
                    </div>
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{listing.title}</h3>
                      <p style={styles.cardPrice}>${listing.price}</p>
                      <div style={styles.cardMeta}>
                        <span>{listing.category}</span>
                        <span>{listing.createdAt ? new Date(listing.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  <p>
                    {searchTerm || selectedCategory !== 'All'
                      ? `No listings found${searchTerm ? ` for "${searchTerm}"` : ''}${selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}. Try a different search or category.`
                      : 'No listings yet. Be the first to post!'
                    }
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

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

              <div style={styles.formGroup}>
                <label style={styles.label}>Photos (Up to 5)</label>
                <div style={styles.imageUpload}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    id="image-upload"
                    multiple
                  />
                  <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                    <p>📷 Click to upload images</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      You can select up to 5 images
                    </p>
                  </label>
                </div>
                {imagePreviews.length > 0 && (
                  <div style={styles.imagePreviewContainer}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={styles.imagePreview}>
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={styles.removeImageButton}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  onClick={() => {
                    setShowModal(false);
                    setImageFiles([]);
                    setImagePreviews([]);
                  }}
                  style={{...styles.button, ...styles.secondaryButton, flex: 1}}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div style={styles.modal} onClick={() => setSelectedListing(null)}>
          <div style={{...styles.modalContent, maxWidth: '800px'}} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#111827' }}>{selectedListing.title}</h2>
              <button
                onClick={() => setSelectedListing(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ×
              </button>
            </div>

            {/* Image Slider */}
            {(selectedListing.imageUrls && selectedListing.imageUrls.length > 0) || selectedListing.imageUrl ? (
              <div style={styles.imageSlider}>
                {selectedListing.imageUrls && selectedListing.imageUrls.length > 1 && (
                  <>
                    <button
                      style={{...styles.sliderButton, left: '1rem'}}
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? selectedListing.imageUrls.length - 1 : prev - 1
                      )}
                    >
                      ‹
                    </button>
                    <button
                      style={{...styles.sliderButton, right: '1rem'}}
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === selectedListing.imageUrls.length - 1 ? 0 : prev + 1
                      )}
                    >
                      ›
                    </button>
                  </>
                )}
                
                <img 
                  src={selectedListing.imageUrls ? 
                    selectedListing.imageUrls[currentImageIndex] : 
                    selectedListing.imageUrl
                  } 
                  alt={selectedListing.title}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
                
                {selectedListing.imageUrls && selectedListing.imageUrls.length > 1 && (
                  <div style={styles.imageIndicators}>
                    {selectedListing.imageUrls.map((_, index) => (
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
            ) : null}

            <div style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginBottom: '1rem' }}>
                ${selectedListing.price}
              </p>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                <strong>Category:</strong> {selectedListing.category}
              </p>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                <strong>Posted:</strong> {selectedListing.createdAt ? new Date(selectedListing.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
              </p>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                <strong>Seller:</strong> {selectedListing.userEmail}
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#111827' }}>Description</h3>
              <p style={{ lineHeight: '1.6', color: '#4b5563' }}>{selectedListing.description}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              {selectedListing.userId !== user.uid ? (
                <button
                  onClick={() => setShowMessageModal(true)}
                  style={{...styles.button, ...styles.primaryButton, flex: 1}}
                >
                  Message Seller
                </button>
              ) : (
                <button
                  onClick={() => handleDeleteListing(selectedListing.id)}
                  style={{...styles.button, ...styles.dangerButton, flex: 1}}
                >
                  Delete Listing
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedListing && (
        <div style={styles.modal} onClick={() => setShowMessageModal(false)}>
          <div style={{...styles.modalContent, maxWidth: '500px'}} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', color: '#111827' }}>Send Message</h2>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              About: <strong>{selectedListing.title}</strong>
            </p>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              To: <strong>{selectedListing.userEmail}</strong>
            </p>
            
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={styles.textarea}
              placeholder="Hi, I'm interested in your item..."
              rows="5"
              autoFocus
            />
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                onClick={handleSendMessage}
                style={{...styles.button, ...styles.primaryButton, flex: 1}}
                disabled={!messageText.trim()}
              >
                Send Message
              </button>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setMessageText('');
                }}
                style={{...styles.button, ...styles.secondaryButton, flex: 1}}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}