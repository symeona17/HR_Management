import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

import type { AppProps } from 'next/app';
import { fetchMe } from '../utils/authApi';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      // Don't check auth on login page
      if (router.pathname === '/login') {
        if (mounted) setAuthChecked(true);
        return;
      }

      // Client-only check: call /me (sends cookie)
      try {
        const me = await fetchMe();
        // save minimal info for UI
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_email', me.email || '');
          localStorage.setItem('user_role', me.role || '');
        }
        if (mounted) setAuthChecked(true);
      } catch (err) {
        // not authenticated
        router.replace('/login');
      }
    };

    check();

    // refresh session on route change: call /me to renew cookie
    const handleRouteChange = () => {
      fetchMe().catch(() => {});
    };
    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      mounted = false;
      router.events.off('routeChangeComplete', handleRouteChange);
    };
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