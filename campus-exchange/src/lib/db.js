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
export async function createListing(listingData, imageFile) {
  try {
    let imageUrl = '';
    
    // Upload image if provided
    if (imageFile) {
      const storageRef = ref(storage, `listings/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    // Add listing to Firestore
    const docRef = await addDoc(collection(db, 'listings'), {
      ...listingData,
      imageUrl,
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