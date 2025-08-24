
import { useEffect, useState } from 'react';
import { fetchSkills, createSkill, searchSkills } from '../utils/api';
import NavBar from '../components/NavBar';


const SkillsPage = () => {
  const [role, setRole] = useState('');

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('user_role') || '');
    }
  }, []);


  // Search handler
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearched(true);
    setLoading(true);
    setError('');
    if (!search.trim()) {
      setSkills([]);
      setLoading(false);
      return;
    }
    try {
      // Fetch all skills and filter client-side (API does not support search param)
  const data = await fetchSkills(100); // fetch more to allow searching, backend max is 100
      const filtered = (data.skills || []).filter((skill: any) =>
        skill.preferred_label.toLowerCase().includes(search.trim().toLowerCase())
      ).slice(0, 25);
      setSkills(filtered);
    } catch (err) {
      setError('Failed to fetch skills');
      setSkills([]);
    }
    setLoading(false);
  };

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

  // Use NavBar search bar for skills search
  return (
    <div style={{ width: '100vw', minHeight: '100vh', minWidth: 320, background: '#F5F5F5' }}>
      <NavBar showSearch onSearchChange={async (value: string) => {
        setSearch(value);
        setSearched(true);
        setLoading(true);
        setError('');
        if (!value.trim()) {
          setSkills([]);
          setLoading(false);
          return;
        }
        try {
          const data = await searchSkills(value);
          setSkills(data.skills || []);
        } catch (err) {
          setError('Failed to fetch skills');
          setSkills([]);
        }
        setLoading(false);
      }} />
      <div style={{ height: 48 }} /> {/* whitespace at the top */}
      <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 32 }}>
        <div style={{ height: 32 }} />
        <h2 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Skills Search</h2>
        {loading ? (
          <div>Loading skills...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : !search.trim() || !searched ? (
          <div style={{ color: '#888', fontSize: 18, marginTop: 32 }}>Please enter a skill name and search to see results.</div>
        ) : skills.length === 0 ? (
          <div style={{ color: '#888', fontSize: 18, marginTop: 32 }}>No results found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0' }}>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Preferred Label</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Skill Type</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Reuse Level</th>
                <th style={{ padding: 8, border: '1px solid #ddd' }}>Alt Labels</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill: any) => (
                <tr key={skill.id}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{skill.id}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{skill.preferred_label}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{skill.skill_type}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{skill.reuse_level}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{skill.alt_labels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SkillsPage;
