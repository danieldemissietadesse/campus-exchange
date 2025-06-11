// src/app/page.js
'use client';

import { useState, useEffect } from 'react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Auth from '@/components/Auth';
import { createListing, getListings } from '@/lib/db';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [listings, setListings] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        setUser(user);
        loadListings();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadListings = async () => {
    try {
      const data = await getListings();
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createListing({
        ...formData,
        userId: user.uid,
        userEmail: user.email,
        price: parseFloat(formData.price)
      });
      await loadListings();
      setShowPostModal(false);
      setFormData({ title: '', category: '', price: '', description: '' });
    } catch (error) {
      alert('Error posting item: ' + error.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Auth onAuth={() => window.location.reload()} />;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Campus Exchange</h1>
          <nav className="flex gap-4 items-center">
            <span>{user.email}</span>
            <button 
              onClick={() => setShowPostModal(true)}
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-600"
            >
              Sell Item
            </button>
            <button
              onClick={() => signOut(auth)}
              className="bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        {/* Search */}
        <div className="bg-white p-4 rounded mb-6">
          <input 
            type="text" 
            placeholder="Search items..."
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Listings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {listings.map(item => (
            <div key={item.id} className="bg-white p-4 rounded shadow hover:shadow-lg cursor-pointer">
              <div className="h-40 bg-gray-200 rounded mb-3"></div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-green-600 text-xl font-bold">${item.price}</p>
              <p className="text-gray-500 text-sm">{item.category} • {item.time}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Post Modal */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Post New Item</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Item title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border rounded mb-3"
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-2 border rounded mb-3"
                required
              >
                <option value="">Select category</option>
                <option value="Textbooks">Textbooks</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
              </select>
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full p-2 border rounded mb-3"
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded mb-3"
                rows="3"
                required
              />
              <div className="flex gap-2">
                <button 
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex-1"
                >
                  Post
                </button>
                <button 
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}