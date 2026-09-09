'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/app/firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  and,
  or,
  getDocs
} from 'firebase/firestore';
import { markMessageAsRead } from '@/lib/api';

export default function MessageConversation({ conversation, onBack }) {
  const { otherUserEmail, otherUserId, listingId, listingTitle } = conversation;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!currentUser || !otherUserId || !listingId) {
      console.log('Missing required data:', { currentUser: !!currentUser, otherUserId, listingId });
      return;
    }

    // Create queries for messages between these two users about this listing
    const sentMessagesQuery = query(
      collection(db, 'messages'),
      where('listingId', '==', listingId),
      where('senderId', '==', currentUser.uid),
      where('recipientId', '==', otherUserId)
    );

    const receivedMessagesQuery = query(
      collection(db, 'messages'),
      where('listingId', '==', listingId),
      where('senderId', '==', otherUserId),
      where('recipientId', '==', currentUser.uid)
    );

    // Set up real-time listeners for both queries
    const unsubscribeSent = onSnapshot(sentMessagesQuery, (snapshot) => {
      const sentMessages = [];
      snapshot.forEach((doc) => {
        sentMessages.push({ id: doc.id, ...doc.data(), type: 'sent' });
      });
      
      // Combine with existing received messages
      setMessages(prev => {
        const received = prev.filter(m => m.type === 'received');
        const combined = [...received, ...sentMessages];
        return combined.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });
      });
    });

    const unsubscribeReceived = onSnapshot(receivedMessagesQuery, (snapshot) => {
      const receivedMessages = [];
      snapshot.forEach((doc) => {
        receivedMessages.push({ id: doc.id, ...doc.data(), type: 'received' });
      });
      
      // Combine with existing sent messages
      setMessages(prev => {
        const sent = prev.filter(m => m.type === 'sent');
        const combined = [...sent, ...receivedMessages];
        return combined.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });
      });
      
      setLoading(false);
      scrollToBottom();
    });

    // Cleanup
    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [currentUser, otherUserId, listingId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark unread messages as read when conversation opens
  useEffect(() => {
    if (!currentUser || messages.length === 0) return;

    const unreadMessages = messages.filter(message => 
      !message.read && 
      message.recipientId === currentUser.uid
    );

    // Mark each unread message as read
    unreadMessages.forEach(async (message) => {
      try {
        await markMessageAsRead(message.id);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });
  }, [messages, currentUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const messageData = {
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        recipientId: otherUserId,
        recipientEmail: otherUserEmail,
        listingId: listingId,
        listingTitle: listingTitle,
        message: messageText,
        createdAt: serverTimestamp(),
        read: false
      };

      console.log('Sending message:', messageData);
      await addDoc(collection(db, 'messages'), messageData);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
      alert('Failed to send message. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
  };

  const formatDateHeader = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentGroup = null;
    
    messages.forEach((message) => {
      const messageDate = message.createdAt ? new Date(message.createdAt.seconds * 1000).toDateString() : null;
      
      if (!currentGroup || currentGroup.date !== messageDate) {
        currentGroup = {
          date: messageDate,
          timestamp: message.createdAt,
          messages: [message]
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    });
    
    return groups;
  };

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      height: '600px',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    header: {
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    backButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1.5rem',
      color: '#6b7280',
      padding: '0.25rem',
      borderRadius: '4px',
      transition: 'background-color 0.2s'
    },
    headerInfo: {
      flex: 1
    },
    headerTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#111827',
      margin: 0
    },
    headerSubtitle: {
      fontSize: '0.875rem',
      color: '#6b7280',
      margin: 0
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '1.5rem',
      backgroundColor: '#ffffff'
    },
    messageGroup: {
      marginBottom: '1rem'
    },
    message: {
      maxWidth: '70%',
      marginBottom: '0.5rem',
      wordWrap: 'break-word'
    },
    sentMessage: {
      marginLeft: 'auto',
      textAlign: 'right'
    },
    receivedMessage: {
      marginRight: 'auto',
      textAlign: 'left'
    },
    messageBubble: {
      display: 'inline-block',
      padding: '0.75rem 1rem',
      borderRadius: '18px',
      maxWidth: '100%',
      wordBreak: 'break-word'
    },
    sentBubble: {
      backgroundColor: '#003366',
      color: 'white',
      borderBottomRightRadius: '4px'
    },
    receivedBubble: {
      backgroundColor: '#f3f4f6',
      color: '#111827',
      borderBottomLeftRadius: '4px'
    },
    messageTime: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginTop: '0.25rem',
      marginBottom: '0.5rem'
    },
    inputContainer: {
      padding: '1rem 1.5rem',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb'
    },
    inputForm: {
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'center'
    },
    messageInput: {
      flex: 1,
      padding: '0.75rem 1rem',
      border: '2px solid #e5e7eb',
      borderRadius: '24px',
      fontSize: '1rem',
      outline: 'none',
      transition: 'border-color 0.2s',
      backgroundColor: 'white',
      color: '#000000'
    },
    sendButton: {
      padding: '0.75rem 1.5rem',
      backgroundColor: '#003366',
      color: 'white',
      border: 'none',
      borderRadius: '24px',
      cursor: 'pointer',
      fontSize: '1rem',
      fontWeight: '500',
      transition: 'background-color 0.2s',
      whiteSpace: 'nowrap'
    },
    emptyState: {
      textAlign: 'center',
      color: '#6b7280',
      padding: '3rem',
      fontSize: '0.875rem'
    },
    loadingState: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      color: '#6b7280'
    },
    dateHeader: {
      textAlign: 'center',
      margin: '1.5rem 0 1rem 0',
      position: 'relative'
    },
    dateHeaderText: {
      backgroundColor: '#ffffff',
      color: '#6b7280',
      fontSize: '0.75rem',
      fontWeight: '500',
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingState}>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button 
          onClick={onBack}
          style={styles.backButton}
          onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          ←
        </button>
        <div style={styles.headerInfo}>
          <h3 style={styles.headerTitle}>{listingTitle}</h3>
          <p style={styles.headerSubtitle}>Conversation with {otherUserEmail}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groupMessagesByDate(messages).map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Header */}
              <div style={styles.dateHeader}>
                <span style={styles.dateHeaderText}>
                  {formatDateHeader(group.timestamp)}
                </span>
              </div>
              
              {/* Messages in this date group */}
              {group.messages.map((message) => {
                const isSent = message.type === 'sent';
                return (
                  <div 
                    key={message.id} 
                    style={{
                      ...styles.message,
                      ...(isSent ? styles.sentMessage : styles.receivedMessage)
                    }}
                  >
                    <div 
                      style={{
                        ...styles.messageBubble,
                        ...(isSent ? styles.sentBubble : styles.receivedBubble)
                      }}
                    >
                      {message.message}
                    </div>
                    <div style={styles.messageTime}>
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={styles.messageInput}
            onFocus={(e) => e.target.style.borderColor = '#003366'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <button 
            type="submit" 
            style={styles.sendButton}
            disabled={!newMessage.trim()}
            onMouseOver={(e) => e.target.style.backgroundColor = '#002244'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#003366'}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}