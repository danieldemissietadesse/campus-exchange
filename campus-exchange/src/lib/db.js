// src/lib/db.js
import { db, storage } from '@/app/firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Create a new listing
export async function createListing(listingData, imageFiles) {
  try {
    let imageUrls = [];
    
    // Upload images if provided
    if (imageFiles && imageFiles.length > 0) {
      for (const imageFile of imageFiles) {
        const storageRef = ref(storage, `listings/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        const url = await getDownloadURL(snapshot.ref);
        imageUrls.push(url);
      }
    }

    // Add listing to Firestore
    const docRef = await addDoc(collection(db, 'listings'), {
      ...listingData,
      imageUrls,
      createdAt: serverTimestamp(),
      status: 'active'
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

// Get all listings
export async function getListings(category = null) {
  try {
    let q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
    
    if (category) {
      q = query(
        collection(db, 'listings'), 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const listings = [];
    
    querySnapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() });
    });

    return listings;
  } catch (error) {
    console.error('Error getting listings:', error);
    throw error;
  }
}

// Delete a listing
export async function deleteListing(listingId) {
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
}

// Send a message
export async function sendMessage(messageData) {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      createdAt: serverTimestamp(),
      read: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Get messages for a user
export async function getMessages(userId) {
  try {
    const q = query(
      collection(db, 'messages'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

// Mark message as read
export async function markMessageAsRead(messageId) {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      read: true
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}