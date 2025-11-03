const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// Utility for backend login using cookie-based auth
export async function loginBackend(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
    credentials: 'include', // important: allow httpOnly cookie to be set
  });
  if (!res.ok) throw new Error('Login failed');
  return await res.json();
}

// Fetch current user using cookie-based session
export async function fetchMe() {
  const res = await fetch(`${API_BASE_URL}/me`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return await res.json();
}
