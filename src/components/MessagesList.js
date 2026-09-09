// src/components/MessagesList.js
import { useState, useEffect } from 'react';
import MessageConversation from './MessageConversation';

export default function MessagesList({ messages, currentUserId }) {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    // Group messages by conversation (listingId + other participant)
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const otherUserId = message.senderId === currentUserId ? message.recipientId : message.senderId;
      const otherUserEmail = message.senderId === currentUserId ? message.recipientEmail : message.senderEmail;
      const conversationKey = `${message.listingId}-${otherUserId}`;
      
      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          id: conversationKey,
          listingId: message.listingId,
          listingTitle: message.listingTitle || 'Unknown Item',
          listingImageUrl: message.listingImageUrl || null,
          otherUserId,
          otherUserEmail: otherUserEmail || 'Unknown User',
          messages: [],
          lastMessage: null,
          unreadCount: 0
        });
      }
      
      const conversation = conversationMap.get(conversationKey);
      conversation.messages.push(message);
      
      // Update last message
      if (!conversation.lastMessage || 
          (message.createdAt?.seconds || 0) > (conversation.lastMessage.createdAt?.seconds || 0)) {
        conversation.lastMessage = message;
      }
      
      // Count unread messages
      if (!message.read && message.recipientId === currentUserId) {
        conversation.unreadCount++;
      }
    });
    
    // Convert to array and sort by last message time
    const conversationList = Array.from(conversationMap.values()).sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.seconds || 0;
      const bTime = b.lastMessage?.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    
    setConversations(conversationList);
  }, [messages, currentUserId]);


  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (text, maxLength = 60) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getDisplayName = (email) => {
    if (!email || typeof email !== 'string') return 'Unknown User';
    const parts = email.split('@');
    return parts.length > 0 ? parts[0] : 'Unknown User';
  };

  if (conversations.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Messages</h1>
        </div>
        <div style={styles.emptyState}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={styles.emptyIcon}>
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#cccccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 style={styles.emptyTitle}>No messages yet</h3>
          <p style={styles.emptyText}>
            Start a conversation by messaging someone about their listing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Messages</h1>
        <span style={styles.subtitle}>{conversations.length} conversations</span>
      </div>

      {!selectedConversation ? (
        <div style={styles.conversationsList}>
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              style={styles.conversationCard}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div style={styles.conversationContent}>
                {/* Listing Image */}
                <div style={styles.listingImageContainer}>
                  {conversation.listingImageUrl ? (
                    <img 
                      src={conversation.listingImageUrl} 
                      alt={conversation.listingTitle}
                      style={styles.listingImage}
                    />
                  ) : (
                    <div style={styles.placeholderImage}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V9" stroke="#ccc" strokeWidth="1.5"/>
                        <circle cx="9" cy="9" r="3" stroke="#ccc" strokeWidth="1.5"/>
                        <path d="M21 15L17 11L5 23" stroke="#ccc" strokeWidth="1.5"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Conversation Details */}
                <div style={styles.conversationDetails}>
                  <div style={styles.conversationHeader}>
                    <div style={styles.conversationInfo}>
                      <h3 style={styles.conversationTitle}>
                        {conversation.listingTitle}
                      </h3>
                      <p style={styles.conversationParticipant}>
                        with {getDisplayName(conversation.otherUserEmail)}
                      </p>
                    </div>
                    <div style={styles.conversationMeta}>
                      {conversation.unreadCount > 0 && (
                        <span style={styles.unreadBadge}>
                          {conversation.unreadCount}
                        </span>
                      )}
                      <span style={styles.timestamp}>
                        {formatTime(conversation.lastMessage?.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  {conversation.lastMessage && (
                    <div style={styles.lastMessage}>
                      <span style={styles.lastMessageSender}>
                        {conversation.lastMessage.senderId === currentUserId ? 'You: ' : ''}
                      </span>
                      <span style={styles.lastMessageText}>
                        {truncateMessage(conversation.lastMessage.message || conversation.lastMessage.content)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <MessageConversation 
          conversation={selectedConversation}
          onBack={() => setSelectedConversation(null)}
        />
      )}
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
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #f0f0f0'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    margin: '0 0 0.25rem 0',
    color: '#000000'
  },
  subtitle: {
    fontSize: '0.9375rem',
    color: '#666666',
    fontWeight: '400'
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
    fontSize: '1.25rem',
    fontWeight: '500',
    margin: '0 0 0.5rem 0',
    color: '#666666'
  },
  emptyText: {
    fontSize: '0.9375rem',
    color: '#999999',
    margin: 0,
    lineHeight: '1.5'
  },
  conversationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  conversationCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #f0f0f0',
    borderRadius: '12px',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  conversationContent: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start'
  },
  listingImageContainer: {
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    flexShrink: 0,
    border: '1px solid #e5e5e5'
  },
  listingImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9'
  },
  conversationDetails: {
    flex: 1,
    minWidth: 0
  },
  conversationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem'
  },
  conversationInfo: {
    flex: 1
  },
  conversationTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    margin: '0 0 0.25rem 0',
    color: '#000000',
    letterSpacing: '-0.01em'
  },
  conversationParticipant: {
    fontSize: '0.875rem',
    color: '#666666',
    margin: 0,
    fontWeight: '400'
  },
  conversationMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  unreadBadge: {
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '0.6875rem',
    fontWeight: '600',
    minWidth: '18px',
    textAlign: 'center'
  },
  timestamp: {
    fontSize: '0.8125rem',
    color: '#999999',
    fontWeight: '400'
  },
  lastMessage: {
    fontSize: '0.875rem',
    color: '#666666',
    lineHeight: '1.4'
  },
  lastMessageSender: {
    fontWeight: '500'
  },
  lastMessageText: {
    fontWeight: '400'
  }
};

