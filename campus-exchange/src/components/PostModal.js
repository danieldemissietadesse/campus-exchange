// src/components/PostModal.js
import { useState } from 'react';
import { createListing } from '@/lib/api';

export default function PostModal({ user, onClose }) {
  const [form, setForm] = useState({
    title: '',
    price: '',
    category: '',
    description: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["Textbooks", "Electronics", "Furniture", "Clothing", "Dorm Supplies", "Other"];

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
    setIsSubmitting(true);
    
    try {
      await createListing({
        ...form,
        userId: user.uid,
        userEmail: user.email,
        price: parseFloat(form.price),
        images: imageFiles
      });
      
      onClose();
      setForm({ title: '', price: '', category: '', description: '' });
      setImageFiles([]);
      setImagePreviews([]);
      
      // Success feedback
      const notification = document.createElement('div');
      notification.textContent = '✅ Item posted successfully!';
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
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
    } catch (error) {
      alert('Error posting item: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>✨ Post New Item</h2>
          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Item Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                style={styles.input}
                placeholder="e.g., Calculus Textbook - Like New"
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Price ($)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({...form, price: e.target.value})}
                style={styles.input}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({...form, category: e.target.value})}
              style={styles.select}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryIcon(cat)} {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              style={styles.textarea}
              placeholder="Describe your item's condition, size, features, etc. Be detailed to attract buyers!"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Photos (Up to 5) 📷</label>
            <div style={styles.imageUpload}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
                id="image-upload"
                multiple
              />
              <label htmlFor="image-upload" style={styles.imageUploadLabel}>
                <span style={styles.uploadIcon}>📷</span>
                <span style={styles.uploadText}>Click to upload images</span>
                <span style={styles.uploadSubtext}>
                  Add photos to increase interest! ({imageFiles.length}/5)
                </span>
              </label>
            </div>
            
            {imagePreviews.length > 0 && (
              <div style={styles.imagePreviewContainer}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={styles.imagePreview}>
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`} 
                      style={styles.previewImage}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={styles.removeImageButton}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={styles.actions}>
            <button 
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.primaryButton,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? '🔄 Posting...' : '🚀 Post Item'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              style={styles.secondaryButton}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getCategoryIcon(category) {
  const icons = {
    "Textbooks": "📚",
    "Electronics": "💻", 
    "Furniture": "🪑",
    "Clothing": "👕",
    "Dorm Supplies": "🏠",
    "Other": "📦"
  };
  return icons[category] || "📦";
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
    alignItems: 'center'
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
    padding: '0.25rem',
    borderRadius: '4px',
    transition: 'all 0.2s'
  },
  form: {
    padding: '1.5rem'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1rem'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151',
    fontSize: '0.875rem'
  },
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    color: '#1a202c',
    backgroundColor: 'white',
    transition: 'border-color 0.2s',
    outline: 'none'
  },
  select: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: 'white',
    color: '#1a202c',
    outline: 'none'
  },
  textarea: {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    minHeight: '120px',
    resize: 'vertical',
    color: '#1a202c',
    backgroundColor: 'white',
    outline: 'none',
    fontFamily: 'inherit'
  },
  imageUpload: {
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#f8fafc'
  },
  imageUploadLabel: {
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#64748b'
  },
  uploadIcon: {
    fontSize: '2.5rem'
  },
  uploadText: {
    fontSize: '1rem',
    fontWeight: '500'
  },
  uploadSubtext: {
    fontSize: '0.875rem',
    opacity: 0.8
  },
  imagePreviewContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  imagePreview: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #e2e8f0'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
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
    fontSize: '0.875rem',
    fontWeight: 'bold'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem'
  },
  primaryButton: {
    flex: 1,
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
  },
  secondaryButton: {
    flex: 1,
    background: '#f1f5f9',
    color: '#475569',
    border: '2px solid #e2e8f0',
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s'
  }
};