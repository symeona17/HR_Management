import { useEffect, useState } from 'react';
import { fetchSkills, createSkill } from '../utils/api';
import NavBar from '../components/NavBar';

const SkillsPage = () => {
  const [skills, setSkills] = useState<{ name: string; category: string }[]>([]);
  const [form, setForm] = useState({ name: '', category: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadSkills = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSkills();
      setSkills(Array.isArray(data.skill) ? data.skill : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await createSkill(form);
      setForm({ name: '', category: '' });
      setSuccess(true);
      loadSkills();
    } catch (e: any) {
      setError(e.message || 'Failed to create skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <NavBar />
      <div style={{ maxWidth: 600, margin: '100px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee' }}>
        <h2>Skill Management</h2>
        <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Skill Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="Category"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              required
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, background: '#3FD270', color: '#fff', border: 'none', fontWeight: 600 }} disabled={loading}>
              Add Skill
            </button>
          </div>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          {success && <div style={{ color: 'green', marginBottom: 8 }}>Skill added successfully!</div>}
        </form>
        <h3>All Skills</h3>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {skills.map((skill, idx) => (
              <li key={idx} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                <strong>{skill.name}</strong> <span style={{ color: '#888' }}>({skill.category})</span>
              </li>
            ))}
            {skills.length === 0 && <li>No skills found.</li>}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SkillsPage;
