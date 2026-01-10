'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Token de vérification manquant');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Erreur lors de la vérification');
        return;
      }

      setStatus('success');
      setMessage(data.message || 'Email vérifié avec succès');

      // rediriger vers page connexion après 3s
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setMessage('Erreur lors de la vérification. Veuillez réessayer.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {status === 'loading' && (
          <>
            <Loader2 style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              color: '#3b82f6',
              animation: 'spin 1s linear infinite'
            }} />
            <h1 style={{ margin: '0 0 10px', color: '#1f2937', fontSize: '24px' }}>
              Vérification en cours...
            </h1>
            <p style={{ margin: 0, color: '#6b7280' }}>
              Veuillez patienter pendant que nous vérifions votre email.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              color: '#10b981'
            }} />
            <h1 style={{ margin: '0 0 10px', color: '#1f2937', fontSize: '24px' }}>
              Email vérifié !
            </h1>
            <p style={{ margin: '0 0 20px', color: '#6b7280' }}>
              {message}
            </p>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
              Redirection vers la page de connexion...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              color: '#ef4444'
            }} />
            <h1 style={{ margin: '0 0 10px', color: '#1f2937', fontSize: '24px' }}>
              Erreur de vérification
            </h1>
            <p style={{ margin: '0 0 20px', color: '#6b7280' }}>
              {message}
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Aller à la page de connexion
            </button>
          </>
        )}

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#f3f4f6'
      }}>
        <div style={{
          maxWidth: '500px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <Loader2 style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 20px',
            color: '#3b82f6',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ margin: 0, color: '#6b7280' }}>
            Chargement...
          </p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

