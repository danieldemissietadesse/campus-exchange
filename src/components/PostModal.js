// src/components/PostModal.js
"use client";

import { useState } from "react";
import { createListing } from "@/lib/api";

export default function PostModal({ user, onClose }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Other"
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = ["Textbooks", "Electronics", "Furniture", "Clothing", "Dorm Supplies", "Other"];

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setImages([...images, ...files]);
    if (error) setError("");
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim() || !form.price) {
      setError("Please fill in all required fields");
      return;
    }

    if (isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
      setError("Please enter a valid price");
      return;
    }

    setLoading(true);

    try {
      const imageFiles = images.length > 0 ? images : [];
      
      await createListing({
        ...form,
        userId: user.uid,
        userEmail: user.email,
        price: parseFloat(form.price),
        images: imageFiles
      });

      onClose();
    } catch (err) {
      console.error("Error posting item:", err);
      setError("Error posting item: " + (err.message || "Failed to fetch"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Post New Item</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" stroke="#666666" strokeWidth="2" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="#666666" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleInputChange}
              placeholder="What are you selling?"
              style={styles.input}
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleInputChange}
              style={styles.select}
              disabled={loading}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Price *</label>
            <div style={styles.priceContainer}>
              <span style={styles.priceSymbol}>$</span>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                placeholder="0.00"
                style={styles.priceInput}
                disabled={loading}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              placeholder="Describe your item..."
              style={styles.textarea}
              disabled={loading}
              maxLength={500}
            />
            <div style={styles.charCount}>
              {form.description.length}/500
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Photos (Up to 5) 
              <span style={styles.optional}>📷</span>
            </label>
            
            <div style={styles.imageUpload}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                style={styles.fileInput}
                disabled={loading}
                id="image-upload"
              />
              <label htmlFor="image-upload" style={styles.uploadLabel}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={styles.uploadIcon}>
                  <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H19C20.1 3 21 3.9 21 5V9" stroke="#999999" strokeWidth="1.5"/>
                  <circle cx="9" cy="9" r="3" stroke="#999999" strokeWidth="1.5"/>
                  <path d="M21 15L17 11L5 23" stroke="#999999" strokeWidth="1.5"/>
                </svg>
                <span style={styles.uploadText}>Click to upload images</span>
                <span style={styles.uploadSubtext}>Add photos to increase interest! (1/5)</span>
              </label>
            </div>

            {images.length > 0 && (
              <div style={styles.imagePreview}>
                {images.map((image, index) => (
                  <div key={index} style={styles.imageItem}>
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      style={styles.previewImage}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={styles.removeButton}
                      disabled={loading}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <line x1="18" y1="6" x2="6" y2="18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div style={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={styles.errorIcon}>
                <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" strokeWidth="2"/>
              </svg>
              {error}
            </div>
          )}

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.secondaryButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.primaryButton}
              disabled={loading}
            >
              {loading ? (
                <div style={styles.loadingSpinner}>
                  <div style={styles.spinner}></div>
                  Posting...
                </div>
              ) : (
                "🚀 Post Item"
              )}
            </button>
          </div>
        </form>
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
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif'
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
  form: {
    padding: '2rem',
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
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  optional: {
    fontSize: '0.75rem'
  },
  input: {
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontWeight: '400',
    color: '#000000'
  },
  select: {
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    outline: 'none',
    cursor: 'pointer',
    fontWeight: '400',
    color: '#000000'
  },
  priceContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  priceSymbol: {
    position: 'absolute',
    left: '1rem',
    fontSize: '1rem',
    color: '#666666',
    fontWeight: '500',
    zIndex: 1
  },
  priceInput: {
    padding: '0.875rem 1rem 0.875rem 2rem',
    fontSize: '1rem',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontWeight: '400',
    color: '#000000',
    width: '100%'
  },
  textarea: {
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    outline: 'none',
    minHeight: '120px',
    resize: 'vertical',
    fontFamily: 'inherit',
    fontWeight: '400',
    color: '#000000'
  },
  charCount: {
    fontSize: '0.75rem',
    color: '#999999',
    textAlign: 'right',
    fontWeight: '400'
  },
  imageUpload: {
    position: 'relative'
  },
  fileInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: 'pointer'
  },
  uploadLabel: {
    border: '2px dashed #e5e5e5',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem'
  },
  uploadIcon: {
    opacity: 0.6
  },
  uploadText: {
    fontSize: '0.9375rem',
    fontWeight: '500',
    color: '#666666'
  },
  uploadSubtext: {
    fontSize: '0.8125rem',
    color: '#999999',
    fontWeight: '400'
  },
  imagePreview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  imageItem: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removeButton: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    border: '1px solid #fecaca',
    fontWeight: '400'
  },
  errorIcon: {
    flexShrink: 0
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem'
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    padding: '0.875rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '-0.01em',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '48px'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1px solid #e5e5e5',
    padding: '0.875rem 1rem',
    fontSize: '0.9375rem',
    fontWeight: '500',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '-0.01em'
  },
  loadingSpinner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid #ffffff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

