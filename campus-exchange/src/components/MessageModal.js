// src/components/MessageModal.js - UPDATED MINIMAL DESIGN
import { useState } from 'react';
import { sendMessage } from '@/lib/api';

export default function MessageModal({ listing, currentUser, onClose }) {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true);
    
    try {
      const messageData = {
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        recipientId: listing.userId,
        recipientEmail: listing.userEmail,
        listingId: listing.id,
        listingTitle: listing.title,
        message: messageText.trim()
      };
      
      console.log('Sending message with data:', messageData);
      await sendMessage(messageData);
      
      onClose();
      setMessageText('');
      
      const notification = document.createElement('div');
      notification.textContent = 'Message sent successfully';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #000000;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        font-size: 0.875rem;
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const quickMessages = [
    "Hi! Is this still available?",
    "I'm interested. When can I pick it up?",
    "What's the condition?",
    "Would you consider a lower price?"
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Send Message</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#666666" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div style={styles.content}>
          {/* Listing Info */}
          <div style={styles.listingInfo}>
            <div style={styles.listingImage}>
              {listing.imageUrls && listing.imageUrls.length > 0 ? (
                <img 
                  src={listing.imageUrls[0]} 
                  alt={listing.title}
                  style={styles.listingImg}
                />
              ) : (
                <div style={styles.noImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V9" stroke="#ccc" strokeWidth="1.5"/>
                    <circle cx="9" cy="9" r="3" stroke="#ccc" strokeWidth="1.5"/>
                    <path d="M21 15L17 11L5 23" stroke="#ccc" strokeWidth="1.5"/>
                  </svg>
                </div>
              )}
            </div>
            <div style={styles.listingDetails}>
              <h3 style={styles.listingTitle}>{listing.title}</h3>
              <p style={styles.listingPrice}>${listing.price}</p>
              <p style={styles.listingMeta}>
                To: {listing.userEmail}
              </p>
            </div>
          </div>

          {/* Quick Messages */}
          <div style={styles.quickMessages}>
            <h4 style={styles.quickTitle}>Quick Messages</h4>
            <div style={styles.quickGrid}>
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => setMessageText(msg)}
                  style={styles.quickButton}
                  type="button"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          {/* Message Form */}
          <form onSubmit={handleSendMessage} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Your Message</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={styles.textarea}
                placeholder="Type your message..."
                rows="6"
                required
                autoFocus
              />
              <div style={styles.charCount}>
                {messageText.length} characters
              </div>
            </div>

            <div style={styles.actions}>
              <button
                type="submit"
                disabled={!messageText.trim() || isSending}
                style={{
                  ...styles.sendButton,
                  opacity: (!messageText.trim() || isSending) ? 0.5 : 1,
                  cursor: (!messageText.trim() || isSending) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
              
              <button
                type="button"
                onClick={onClose}
                style={styles.cancelButton}
                disabled={isSending}
              >
                Cancel
              </button>
            </div>
          </form>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem'
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  header: {
    padding: '2rem 2rem 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    margin: 0,
    color: '#000000'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  content: {
    padding: '2rem'
  },
  listingInfo: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    border: '1px solid #f0f0f0'
  },
  listingImage: {
    width: '60px',
    height: '60px',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    flexShrink: 0
  },
  listingImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noImage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cccccc'
  },
  listingDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  listingTitle: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: '#000000',
    margin: 0
  },
  listingPrice: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#000000',
    margin: 0
  },
  listingMeta: {
    fontSize: '0.8125rem',
    color: '#666666',
    margin: 0
  },
  quickMessages: {
    marginBottom: '1.5rem'
  },
  quickTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  quickGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem'
  },
  quickButton: {
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e5e5',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    color: '#333333',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '400'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#000000',
    letterSpacing: '-0.01em'
  },
  textarea: {
    padding: '0.875rem',
    fontSize: '0.9375rem',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    outline: 'none',
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
    color: '#000000',
    lineHeight: '1.5'
  },
  charCount: {
    fontSize: '0.75rem',
    color: '#999999',
    textAlign: 'right'
  },
  actions: {
    display: 'flex',
    gap: '1rem'
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    padding: '0.875rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
    letterSpacing: '-0.01em'
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1px solid #e5e5e5',
    padding: '0.875rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '-0.01em'
  }
};