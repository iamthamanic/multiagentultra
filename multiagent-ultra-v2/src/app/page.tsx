'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>MultiAgent Ultra V2</h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>Redirecting to dashboard...</p>
      <div style={{ 
        marginTop: '2rem',
        width: '200px',
        height: '4px',
        backgroundColor: '#f0f0f0',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#3b82f6',
          animation: 'loading 1s ease-in-out'
        }}></div>
      </div>
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}