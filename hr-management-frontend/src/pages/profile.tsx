
import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import {
  fetchTrainerTrainings,
  fetchTrainerFeedback,
  fetchManagerTeam,
  fetchManagerAnalytics,
  managerAssignTraining
} from '../utils/profileApi';

const ProfilePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
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

  useEffect(() => {
    setEmail(localStorage.getItem('user_email') || 'Unknown');
    setRole(localStorage.getItem('user_role') || 'Unknown');
    const id = localStorage.getItem('user_id');
    setUserId(id ? parseInt(id) : null);
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
                        <td style={{ padding: '8px 12px' }}>{a.avg_feedback ? a.avg_feedback.toFixed(2) : 'N/A'}</td>
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
    </div>
  );
};

export default ProfilePage;
