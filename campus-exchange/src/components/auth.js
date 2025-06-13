// src/components/Auth.js
'use client';

import { useState } from 'react';
import { auth } from '@/app/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';

export default function Auth({ onAuth }) {
  const [isLogin, setIsLogin]       = useState(true);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [resetMsg, setResetMsg]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResetMsg('');

    if (!email.endsWith('@wit.edu')) {
      setError('Please use your WIT email (@wit.edu)');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(user);
        alert('✅ Verification email sent! Please check your inbox.');
      }
      onAuth();
    } catch (err) {
      const map = {
        'auth/user-not-found':       'No account with this email – sign up first.',
        'auth/wrong-password':       'Incorrect password. Try again.',
        'auth/email-already-in-use': 'An account already exists – sign‑in instead.',
        'auth/weak-password':        'Password should be at least 6 characters.',
        'auth/invalid-email':        'Invalid email format.',
        'auth/too-many-requests':    'Too many attempts. Wait a minute and try again.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/invalid-credential':   'Invalid email / password combination.',
      };
      setError(map[err.code] ?? 'Unexpected error – please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setResetMsg('');
    if (!email) {
      setError('Enter your WIT email first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetMsg('Password reset link sent! Check your inbox.');
    } catch (err) {
      setError('Could not send reset email – try again later.');
    }
  }

  /* -------------------------- UI styles (inline) -------------------------- */
  const baseInput = {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    background: '#fff',
    color: '#000',
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',background:'#f3f4f6'}}>
      <header style={{background:'#003366',color:'#fff',padding:'1.5rem 2rem'}}>
        <h1 style={{margin:0,fontSize:'1.75rem'}}>📦 Campus Exchange</h1>
      </header>

      <main style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
        <div style={{background:'#fff',borderRadius:12,padding:'2.5rem',width:'100%',maxWidth:400,boxShadow:'0 4px 6px rgba(0,0,0,0.07)'}}>
          <h2 style={{textAlign:'center',marginBottom:'0.5rem'}}>{isLogin?'Welcome Back!':'Create Account'}</h2>
          <p style={{textAlign:'center',color:'#6b7280',marginBottom:'2rem'}}>
            {isLogin?'Sign in with your WIT email':'Join the WIT marketplace community'}
          </p>

          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:14}}>WIT Email</label>
              <input
                style={baseInput}
                disabled={loading}
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                placeholder="your.name@wit.edu"
              />
            </div>
            <div>
              <label style={{display:'block',marginBottom:4,fontSize:14}}>Password</label>
              <input
                style={baseInput}
                disabled={loading}
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                placeholder={isLogin?'Your password':'At least 6 characters'}
              />
            </div>

            {isLogin && (
              <p style={{textAlign:'right',fontSize:12}}>
                <span style={{color:'#003366',cursor:'pointer'}} onClick={handleForgotPassword}>Forgot password?</span>
              </p>
            )}

            {error && <div style={{background:'#fef2f2',padding:'0.75rem',borderRadius:6,color:'#b91c1c',fontSize:14}}>{error}</div>}
            {resetMsg && <div style={{background:'#dcfce7',padding:'0.75rem',borderRadius:6,color:'#166534',fontSize:14}}>{resetMsg}</div>}

            <button disabled={loading} style={{padding:'0.875rem',borderRadius:8,fontWeight:600,fontSize:'1rem',background:'#003366',color:'#fff',border:'none',cursor:'pointer'}}>
              {loading?'Please wait...':isLogin?'Sign In':'Create Account'}
            </button>
          </form>

          <p style={{textAlign:'center',marginTop:'1.5rem',fontSize:14}}>
            {isLogin?"Don't have an account? ":'Already have an account? '}
            <span style={{color:'#003366',cursor:'pointer'}} onClick={()=>{setIsLogin(!isLogin);setError('');}}>
              {isLogin?'Sign Up':'Sign In'}
            </span>
          </p>
        </div>
      </main>

      <footer style={{background:'#f9fafb',padding:'1.5rem',textAlign:'center',fontSize:12,color:'#6b7280'}}>
        © 2025 Campus Exchange
      </footer>
    </div>
  );
}
