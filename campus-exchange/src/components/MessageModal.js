// src/components/MessageModal.js
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
      
      // Success notification
      const notification = document.createElement('div');
      notification.textContent = '✅ Message sent successfully!';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
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

  const getCategoryIcon = (category) => {
    const icons = {
      "Textbooks": "📚",
      "Electronics": "💻",
      "Furniture": "🪑",
      "Clothing": "👕",
      "Dorm Supplies": "🏠",
      "Other": "📦"
    };
    return icons[category] || "📦";
  };

  const quickMessages = [
    "Hi! Is this item still available?",
    "I'm interested in this item. When can I pick it up?",
    "What's the condition of this item?",
    "Would you consider a lower price?",
    "Can you provide more details about this item?"
  ];

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>💬 Send Message</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
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
                  <span>📷</span>
                </div>
              )}
            </div>
            <div style={styles.listingDetails}>
              <h3 style={styles.listingTitle}>{listing.title}</h3>
              <p style={styles.listingPrice}>${listing.price}</p>
              <p style={styles.listingCategory}>
                {getCategoryIcon(listing.category)} {listing.category}
              </p>
              <p style={styles.sellerInfo}>
                <strong>To:</strong> {listing.userEmail}
              </p>
            </div>
          </div>

          {/* Quick Message Options */}
          <div style={styles.quickMessages}>
            <h4 style={styles.quickTitle}>Quick Messages:</h4>
            <div style={styles.quickButtons}>
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
              <label style={styles.label}>Your Message:</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={styles.textarea}
                placeholder="Type your message here..."
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
                  opacity: (!messageText.trim() || isSending) ? 0.6 : 1,
                  cursor: (!messageText.trim() || isSending) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSending ? (
                  <>
                    <span style={styles.loadingSpinner}>⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span>📤</span>
                    Send Message
                  </>
                )}
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

          {/* Tips */}
          <div style={styles.tips}>
            <h4 style={styles.tipsTitle}>💡 Messaging Tips:</h4>
            <ul style={styles.tipsList}>
              <li>Be polite and respectful in your communication</li>
              <li>Ask specific questions about the item</li>
              <li>Arrange safe meeting locations on campus</li>
              <li>Respond promptly to keep the conversation going</li>
            </ul>
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
    padding: '1rem'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  header: {
    padding: '1.5rem 1.5rem 0 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#64748b',
    padding: '0.5rem',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  content: {
    padding: '1.5rem'
  },
  listingInfo: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  listingImage: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  listingImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  noImage: {
    color: '#94a3b8',
    fontSize: '1.5rem'
  },
  listingDetails: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  listingTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
    lineHeight: '1.4'
  },
  listingPrice: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#10b981',
    margin: 0
  },
  listingCategory: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0
  },
  sellerInfo: {
    fontSize: '0.875rem',
    color: '#475569',
    margin: 0
  },
  quickMessages: {
    marginBottom: '1.5rem'
  },
  quickTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.75rem'
  },
  quickButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  quickButton: {
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    color: '#475569',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    textAlign: 'left',
    transition: 'all 0.2s'
  },
  form: {
    marginBottom: '1.5rem'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  textarea: {
    width: '100%',
    padding: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '1rem',
    color: '#1a202c',
    backgroundColor: 'white',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'border-color 0.2s'
  },
  charCount: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.5rem',
    textAlign: 'right'
  },
  actions: {
    display: 'flex',
    gap: '1rem'
  },
  sendButton: {
    flex: 1,
    background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
    color: 'white',
    border: 'none',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(0, 51, 102, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  },
  cancelButton: {
    flex: 1,
    background: '#f1f5f9',
    color: '#475569',
    border: '2px solid #e2e8f0',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  loadingSpinner: {
    fontSize: '1rem'
  },
  tips: {
    backgroundColor: '#f0f9ff',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #bae6fd'
  },
  tipsTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: '0.5rem'
  },
  tipsList: {
    margin: 0,
    paddingLeft: '1.25rem',
    color: '#0c4a6e',
    fontSize: '0.875rem'
  }
};