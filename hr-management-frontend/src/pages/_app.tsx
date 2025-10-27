import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Don't check auth on login page
    if (router.pathname === '/login') {
      setAuthChecked(true);
      return;
    }

    // Check for token in localStorage (client-only)
    if (typeof window === 'undefined') {
      // We are on server — delay until client
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      // redirect to login; do not render protected page
      router.replace('/login');
      // Do not set authChecked=true here; when navigation reaches /login the effect
      // will run again and mark authChecked true for that page.
      return;
    }

    // Token present — allow rendering
    setAuthChecked(true);
  }, [router.pathname]);

  // While we haven't checked auth (or are in the middle of redirecting), show a small spinner
  if (!authChecked) {
    return (
      <>
        <Head>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ width: 40, height: 40, border: '4px solid rgba(0,0,0,0.08)', borderTop: '4px solid #1976d2', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style jsx global>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;