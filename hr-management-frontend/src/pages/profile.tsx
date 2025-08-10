import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';

const ProfilePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    setEmail(localStorage.getItem('user_email') || 'Unknown');
    setRole(localStorage.getItem('user_role') || 'Unknown');
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', minWidth: 320 }}>
      <NavBar />
      <div style={{ height: 120, background: '#F5F5F5' }} />
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h2 style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: 28, marginBottom: 16 }}>Profile</h2>
        <div style={{ fontFamily: 'Montserrat', fontSize: 18, marginBottom: 8 }}>
          <b>Email:</b> <span>{email}</span>
        </div>
        <div style={{ fontFamily: 'Montserrat', fontSize: 18, marginBottom: 8 }}>
          <b>Role:</b> <span>{role}</span>
        </div>
        <div style={{ fontFamily: 'Montserrat', fontSize: 16, color: '#888' }}>
          (This is a simple profile page. Add more info as needed.)
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
