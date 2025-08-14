// Utility for real backend login
export async function loginBackend(email: string, password: string) {
  const res = await fetch('http://localhost:8000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });
  if (!res.ok) throw new Error('Login failed');
  return await res.json();
}

export async function fetchMe(token: string) {
  const res = await fetch('http://localhost:8000/me', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch user info');
  return await res.json();
}
