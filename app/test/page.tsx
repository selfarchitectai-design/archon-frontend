'use client';

import React, { useState, useEffect } from 'react';

export default function TestPage() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('useEffect çalıştı!');
    setMounted(true);
  }, []);

  // Debug için
  useEffect(() => {
    console.log('mounted değeri:', mounted);
  }, [mounted]);

  if (!mounted) {
    return (
      <div style={{ padding: '50px', background: '#1a1a2e', color: 'white', minHeight: '100vh' }}>
        <h1>⏳ Loading Test...</h1>
        <p>Eğer bu ekranda kalıyorsanız, React hydration sorunu var!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '50px', background: '#1a1a2e', color: 'white', minHeight: '100vh' }}>
      <h1>✅ React Çalışıyor!</h1>
      <p>Mounted: {mounted ? 'TRUE' : 'FALSE'}</p>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(c => c + 1)}
        style={{ padding: '10px 20px', background: '#4ade80', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        Artır
      </button>
    </div>
  );
}
