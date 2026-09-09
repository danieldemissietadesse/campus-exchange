// src/components/ListingsGrid.js

export default function ListingsGrid({ 
  listings, 
  selectedCategory, 
  onListingClick 
}) {
  if (listings.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>
          {selectedCategory === "All" ? "All Items" : selectedCategory} 
          <span style={styles.count}>(0)</span>
        </h3>
        <EmptyState />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>
        {selectedCategory === "All" ? "All Items" : selectedCategory} 
        <span style={styles.count}>({listings.length})</span>
      </h3>
      
      <div style={styles.grid}>
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClick={() => onListingClick(listing)}
          />
        ))}
      </div>
    </div>
  );
}

function ListingCard({ listing, onClick }) {
  return (
    <div 
      style={styles.card}
      onClick={onClick}
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
  );
}

function EmptyState() {
  return (
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

function formatDate(timestamp) {
  if (!timestamp) return 'Just now';
  
  let date;
  // Handle different timestamp formats
  if (timestamp.seconds) {
    // Firebase Timestamp
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp.toDate) {
    // Firebase Timestamp with toDate method
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    // Regular timestamp
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
}

const styles = {
  container: {
    marginTop: '1rem'
  },
  title: {
    fontSize: '1.375rem',
    fontWeight: '600',
    marginBottom: '1.5rem',
    color: '#1a202c',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  count: {
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
  }
};