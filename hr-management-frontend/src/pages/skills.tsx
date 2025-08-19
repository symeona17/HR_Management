import { useEffect, useState } from 'react';
import { fetchSkills, createSkill } from '../utils/api';
import NavBar from '../components/NavBar';

const SkillsPage = () => {
  const [role, setRole] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('user_role') || '');
    }
  }, []);
  if (role !== 'hradmin') {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', minWidth: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5' }}>
        <NavBar />
        <div style={{ fontSize: 22, color: '#D9534F', fontWeight: 600, fontFamily: 'Montserrat', marginTop: 120 }}>
          Access Denied: Only HR Admins are allowed to view this page.
        </div>
      </div>
    );
  }
  // ...existing code for hradmin...
};

export default SkillsPage;
