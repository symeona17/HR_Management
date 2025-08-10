import '../styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  useEffect(() => {
    // Don't check auth on login page
    if (router.pathname === '/login') return;
    // Check for token in localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.replace('/login');
    }
  }, [router.pathname]);
  return <Component {...pageProps} />;
}

export default MyApp;