// src/components/MessagesList.js
import { markMessageAsRead } from '@/lib/api';

export default function MessagesList({ messages, currentUserId }) {
  const handleMarkAsRead = async (messageId, isRead) => {
    if (!isRead) {
      try {
        await markMessageAsRead(messageId);
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const formatMessageTime = (timestamp) => {
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
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Separate received and sent messages
  const receivedMessages = messages.filter(m => m.recipientId === currentUserId);
  const sentMessages = messages.filter(m => m.senderId === currentUserId);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💬 My Messages</h2>
      
      <div style={styles.tabContainer}>
        <div style={styles.tabs}>
          <button style={{...styles.tab, ...styles.activeTab}}>
            📥 Received ({receivedMessages.length})
          </button>
          <button style={styles.tab}>
            📤 Sent ({sentMessages.length})
          </button>
        </div>
      </div>

      {receivedMessages.length > 0 ? (
        <div style={styles.messagesList}>
          {receivedMessages.map(message => (
            <div 
              key={message.id} 
              style={{
                ...styles.messageItem,
                backgroundColor: message.read ? '#ffffff' : '#f0fdf4',
                borderLeft: message.read ? '4px solid #e5e7eb' : '4px solid #10b981'
              }}
              onClick={() => handleMarkAsRead(message.id, message.read)}
            >
              <div style={styles.messageHeader}>
                <div style={styles.messageFrom}>
                  <span style={styles.fromLabel}>From:</span>
                  <span style={styles.fromEmail}>{message.senderEmail}</span>
                  {!message.read && <span style={styles.newBadge}>NEW</span>}
                </div>
                <span style={styles.messageTime}>
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
              
              <div style={styles.messageSubject}>
                <span style={styles.aboutLabel}>About:</span>
                <span style={styles.listingTitle}>{message.listingTitle}</span>
              </div>
              
              <div style={styles.messageContent}>
                {message.message}
              </div>
              
              {!message.read && (
                <div style={styles.actionHint}>
                  Click to mark as read
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>💭</span>
          <h3 style={styles.emptyTitle}>No messages yet</h3>
          <p style={styles.emptyText}>
            When someone contacts you about your listings, their messages will appear here.
          </p>
          <div style={styles.emptyTip}>
            <span style={styles.tipIcon}>💡</span>
            <span>Tip: Make sure your listings have detailed descriptions to attract more inquiries!</span>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: '700',
    marginBottom: '1.5rem',
    color: '#1a202c',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  tabContainer: {
    marginBottom: '1.5rem'
  },
  tabs: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '1rem'
  },
  tab: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: '#f8fafc',
    color: '#64748b',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  activeTab: {
    backgroundColor: '#003366',
    color: 'white'
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  messageItem: {
    padding: '1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #e2e8f0'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem'
  },
  messageFrom: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1
  },
  fromLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  fromEmail: {
    fontWeight: '600',
    color: '#1a202c'
  },
  newBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.125rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600'
  },
  messageTime: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  messageSubject: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem'
  },
  aboutLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500'
  },
  listingTitle: {
    fontWeight: '600',
    color: '#475569'
  },
  messageContent: {
    color: '#374151',
    lineHeight: '1.6',
    fontSize: '0.95rem',
    marginBottom: '0.5rem'
  },
  actionHint: {
    fontSize: '0.75rem',
    color: '#10b981',
    fontStyle: 'italic',
    marginTop: '0.5rem'
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
    marginBottom: '0.75rem',
    color: '#374151'
  },
  emptyText: {
    fontSize: '1rem',
    marginBottom: '1.5rem',
    lineHeight: '1.6'
  },
  emptyTip: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#f0fdf4',
    padding: '1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#166534'
  },
  tipIcon: {
    fontSize: '1rem'
  }
};