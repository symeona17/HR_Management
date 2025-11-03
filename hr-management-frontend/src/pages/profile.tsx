
import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import {
  fetchTrainerTrainings,
  fetchTrainerFeedback,
  fetchManagerTeam,
  fetchManagerAnalytics,
  managerAssignTraining
} from '../utils/profileApi';
import { fetchMe } from '../utils/authApi';
import { API_BASE_URL, apiFetch } from '../utils/api';
import { fmtNumber } from '../utils/format';

const ProfilePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState({ first_name: '', last_name: '', job_title: '', department: '', details: '' });
  // Trainer state
  const [trainerTrainings, setTrainerTrainings] = useState<any[]>([]);
  const [trainerFeedback, setTrainerFeedback] = useState<any[]>([]);
  // Manager state
  const [managerTeam, setManagerTeam] = useState<any[]>([]);
  const [managerAnalytics, setManagerAnalytics] = useState<any[]>([]);
  const [assignStatus, setAssignStatus] = useState<string>('');
  // Assignment form state
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignTrainingId, setAssignTrainingId] = useState('');
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const me = await fetchMe();
        setEmail(me.email || 'Unknown');
        setRole(me.role || 'Unknown');
        setUserId(me.id || null);
        // fetch employee record if employee id available
        if (me.id) {
          const res = await apiFetch(`${API_BASE_URL}/employee/${me.id}`);
          if (res.ok) {
            const emp = await res.json();
            setProfile(emp);
            setFormState({
              first_name: emp.first_name || '',
              last_name: emp.last_name || '',
              job_title: emp.job_title || '',
              department: emp.department || '',
              details: emp.details || '',
            });
            // persist minimal info for UI if needed
            if (typeof window !== 'undefined') {
              localStorage.setItem('user_email', emp.email || '');
              localStorage.setItem('user_role', emp.role || me.role || '');
              localStorage.setItem('user_id', String(emp.id || me.id));
            }
          }
        }
      } catch (err) {
        // failed to load - ignore for now (app-level auth should redirect)
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (role === 'trainer') {
      fetchTrainerTrainings(userId).then(data => setTrainerTrainings(data.trainings || []));
      fetchTrainerFeedback(userId).then(data => setTrainerFeedback(data.feedback || []));
    } else if (role === 'manager') {
      fetchManagerTeam(userId).then(data => setManagerTeam(data.team || []));
      fetchManagerAnalytics(userId).then(data => setManagerAnalytics(data.analytics || []));
    }
  }, [userId, role]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/employee/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });
      if (!res.ok) throw new Error('Save failed');
      const json = await res.json();
      // refresh profile
      const r2 = await apiFetch(`${API_BASE_URL}/employee/${userId}`);
      if (r2.ok) {
        const updated = await r2.json();
        setProfile(updated);
        setEditing(false);
      }
    } catch (err) {
      alert('Failed to save profile');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignStatus('');
    try {
      const res = await managerAssignTraining(Number(assignEmployeeId), Number(assignTrainingId));
      setAssignStatus(res.message || 'Assignment successful');
    } catch (err) {
      setAssignStatus('Assignment failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', minWidth: 320 }}>
      <NavBar />
      <div style={{ height: 120, background: '#F5F5F5' }} />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
        <h2 style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: 28, marginBottom: 16 }}>Profile</h2>
        <div style={{ fontFamily: 'Montserrat', fontSize: 18, marginBottom: 8 }}>
          <b>Email:</b> <span>{email}</span>
        </div>
        <div style={{ fontFamily: 'Montserrat', fontSize: 18, marginBottom: 8 }}>
          <b>Role:</b> <span>{role}</span>
        </div>

        {/* Basic Information (view / edit) */}
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <h3 style={{ marginBottom: 12 }}>Basic Information</h3>
          {!editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ color: '#666', fontSize: 14 }}>First name</div>
                <div style={{ fontSize: 16, fontFamily: 'Montserrat' }}>{profile?.first_name || '-'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 14 }}>Last name</div>
                <div style={{ fontSize: 16, fontFamily: 'Montserrat' }}>{profile?.last_name || '-'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 14 }}>Job title</div>
                <div style={{ fontSize: 16, fontFamily: 'Montserrat' }}>{profile?.job_title || '-'}</div>
              </div>
              <div>
                <div style={{ color: '#666', fontSize: 14 }}>Department</div>
                <div style={{ fontSize: 16, fontFamily: 'Montserrat' }}>{profile?.department || '-'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ color: '#666', fontSize: 14 }}>Details</div>
                <div style={{ fontSize: 16, fontFamily: 'Montserrat' }}>{profile?.details || '-'}</div>
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                <button onClick={() => setEditing(true)}>Edit</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666' }}>First name</label>
                <input value={formState.first_name} onChange={e => setFormState(prev => ({ ...prev, first_name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666' }}>Last name</label>
                <input value={formState.last_name} onChange={e => setFormState(prev => ({ ...prev, last_name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666' }}>Job title</label>
                <input value={formState.job_title} onChange={e => setFormState(prev => ({ ...prev, job_title: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#666' }}>Department</label>
                <input value={formState.department} onChange={e => setFormState(prev => ({ ...prev, department: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: 13, color: '#666' }}>Details</label>
                <textarea value={formState.details} onChange={e => setFormState(prev => ({ ...prev, details: e.target.value }))} rows={4} />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                <button type="submit">Save</button>
                <button type="button" onClick={() => { setEditing(false); /* reset formState to profile values */ setFormState({
                  first_name: profile?.first_name || '',
                  last_name: profile?.last_name || '',
                  job_title: profile?.job_title || '',
                  department: profile?.department || '',
                  details: profile?.details || '',
                }); }}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Trainer Dashboard */}
        {role === 'trainer' && (
          <div style={{ marginTop: 32 }}>
            <h3>Assigned Trainings</h3>
            {trainerTrainings.length === 0 ? (
              <div style={{ color: '#888', fontFamily: 'Montserrat', fontSize: 16, marginBottom: 16 }}>
                No trainings assigned to you yet.
              </div>
            ) : (
              <ul>
                {trainerTrainings.map((t, i) => (
                  <li key={i}>{t.title} ({t.category}) - {t.start_date} to {t.end_date}</li>
                ))}
              </ul>
            )}
            <h3>Feedback for Your Trainings</h3>
            {trainerFeedback.length === 0 ? (
              <div style={{ color: '#888', fontFamily: 'Montserrat', fontSize: 16 }}>
                No feedback available yet.
              </div>
            ) : (
              <ul>
                {trainerFeedback.map((f, i) => (
                  <li key={i}>{f.feedback_date}: {f.comments} (Score: {f.sentiment_score})</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Manager Dashboard */}
        {role === 'manager' && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Your Team</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              {managerTeam.length === 0 ? (
                <div style={{ color: '#888', fontFamily: 'Montserrat', fontSize: 16, marginBottom: 16 }}>No employees assigned to you yet.</div>
              ) : (
                managerTeam.map((emp, i) => (
                  <div key={i} style={{
                    background: '#F9FAFB',
                    borderRadius: 10,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    padding: 16,
                    minWidth: 180,
                    fontFamily: 'Montserrat',
                    fontSize: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                  }}>
                    <b>{emp.first_name} {emp.last_name}</b>
                    <span style={{ color: '#555', fontSize: 14 }}>{emp.email}</span>
                    <span style={{ color: '#888', fontSize: 13 }}>ID: {emp.id}</span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAssign} style={{ marginBottom: 16 }}>
              <input type="number" placeholder="Employee ID" value={assignEmployeeId} onChange={e => setAssignEmployeeId(e.target.value)} required style={{ marginRight: 8 }} />
              <input type="number" placeholder="Training ID" value={assignTrainingId} onChange={e => setAssignTrainingId(e.target.value)} required style={{ marginRight: 8 }} />
              <button type="submit">Assign</button>
            </form>
            {assignStatus && <div style={{ color: assignStatus.includes('fail') ? 'red' : 'green' }}>{assignStatus}</div>}
            <h3 style={{ marginTop: 32, marginBottom: 12 }}>Team Analytics</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Montserrat', fontSize: 16 }}>
                <thead>
                  <tr style={{ background: '#F5F5F5' }}>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Trainings Completed</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Avg. Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {managerAnalytics.length === 0 ? (
                    <tr><td colSpan={3} style={{ color: '#888', padding: 12 }}>No analytics available.</td></tr>
                  ) : (
                    managerAnalytics.map((a, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px 12px' }}>{a.first_name} {a.last_name}</td>
                        <td style={{ padding: '8px 12px' }}>{a.trainings_completed}</td>
                        <td style={{ padding: '8px 12px' }}>{fmtNumber(a.avg_feedback)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Default message for other roles */}
        {role !== 'trainer' && role !== 'manager' && (
          <div style={{ fontFamily: 'Montserrat', fontSize: 16, color: '#888', marginTop: 32 }}>
            (This is a simple profile page. Add more info as needed.)
          </div>
        )}
      </div>

      {/* Change Password */}
      <div style={{ maxWidth: 800, margin: '16px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ marginBottom: 12 }}>Change Password</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setPasswordStatus('');
          if (!userId) {
            setPasswordStatus('User not loaded');
            return;
          }
          if (newPassword !== confirmPassword) {
            setPasswordStatus('New passwords do not match');
            return;
          }
          // Ensure the new password is actually different from the current password
          if (newPassword === currentPassword) {
            setPasswordStatus('New password must be different from current password');
            return;
          }
          try {
            const res = await apiFetch(`${API_BASE_URL}/change-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
            });
            if (res.ok) {
              setPasswordStatus('Password changed successfully');
              setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            } else {
              const txt = await res.text();
              let msg = txt || 'Failed to change password';
              try { const j = JSON.parse(txt); msg = j.detail || j.msg || msg; } catch(_){}
              setPasswordStatus(msg);
            }
          } catch (err) {
            setPasswordStatus('Failed to change password');
          }
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#666' }}>Current password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#666' }}>New password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>
            <div style={{ gridColumn: '2 / 3' }}>
              <label style={{ display: 'block', fontSize: 13, color: '#666' }}>Confirm new password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
              <button type="submit">Change password</button>
              <span style={{ marginLeft: 12, color: passwordStatus.toLowerCase().includes('success') ? 'green' : 'red' }}>{passwordStatus}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
