import React, { useState, useEffect } from 'react';
import TrainingCardOverlay from '../components/TrainingCardOverlay';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import { API_BASE_URL, fetchTrainings, createTraining, updateTraining, deleteTraining, fetchEmployees, requestTraining, apiFetch } from '../utils/api';

// Helper to fetch assigned trainings for employee
async function fetchAssignedTrainings(employeeId: number) {
  const res = await apiFetch(`${API_BASE_URL}/employee/${employeeId}/assigned-trainings`);
  if (!res.ok) throw new Error('Failed to fetch assigned trainings');
  return res.json();
}
// Helper to fetch trainings assigned to a trainer
async function fetchTrainerAssignedTrainings(trainerId: number) {
  const res = await apiFetch(`${API_BASE_URL}/trainer/${trainerId}/trainings`);
  if (!res.ok) throw new Error('Failed to fetch assigned trainings for trainer');
  return res.json();
}
// Helper to fetch employees assigned to a manager
async function fetchManagerTeam(managerId: number) {
  const res = await apiFetch(`${API_BASE_URL}/manager/${managerId}/team`);
  if (!res.ok) throw new Error('Failed to fetch manager team');
  return res.json();
}

const TrainingsPage: React.FC = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  // For managers: trainings assigned to their employees
  const [managerEmployeeTrainings, setManagerEmployeeTrainings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [status, setStatus] = useState<'Ongoing' | 'Finished' | 'All'>('All');
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', category: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [request, setRequest] = useState({ employee_id: '', training_id: '', recommendation_level: 3 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  // For trainers: sidebar option to view assigned trainings
  const [showTrainerAssigned, setShowTrainerAssigned] = useState(false);
  const [trainerAssignedTrainings, setTrainerAssignedTrainings] = useState<any[]>([]);
  // Overlay state
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('user_role') || '');
      const id = localStorage.getItem('user_id');
      setUserId(id ? Number(id) : null);
    }
  }, []);

  // For employees, fetch assigned trainings whenever user_id or role changes
  useEffect(() => {
    if (role === 'employee' && userId) {
      fetchAssignedTrainings(userId)
        .then(data => {
          setTrainings(Array.isArray(data.trainings) ? data.trainings : []);
        })
        .catch(() => {
          setTrainings([]);
        });
    } else if (role === 'employee') {
      setTrainings([]);
    }
  }, [role, userId]);

  // For trainers: fetch assigned trainings when sidebar option is selected
  useEffect(() => {
    if (role === 'trainer' && userId && showTrainerAssigned) {
      fetchTrainerAssignedTrainings(userId)
        .then(data => {
          setTrainerAssignedTrainings(Array.isArray(data.trainings) ? data.trainings : []);
        })
        .catch(() => {
          setTrainerAssignedTrainings([]);
        });
    }
  }, [role, userId, showTrainerAssigned]);

  const loadTrainings = async () => {
    try {
      const data = await fetchTrainings();
      setTrainings(Array.isArray(data.trainings) ? data.trainings : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load trainings');
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await fetchEmployees();
      setEmployees(Array.isArray(data.employees) ? data.employees : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load employees');
    }
  };

  useEffect(() => {
    if (role === 'employee') {
      loadEmployees();
    } else if (role === 'manager' && userId) {
      // Fetch manager's team and their assigned trainings
      fetchManagerTeam(userId).then(async (data) => {
        const team = Array.isArray(data.team) ? data.team : [];
        // Fetch assigned trainings for each employee
        const allTrainings: any[] = [];
        const seen = new Set();
        for (const emp of team) {
          try {
            const tRes = await fetchAssignedTrainings(emp.employee_id || emp.id);
            if (Array.isArray(tRes.trainings)) {
              for (const t of tRes.trainings) {
                if (!seen.has(t.training_id)) {
                  seen.add(t.training_id);
                  allTrainings.push(t);
                }
              }
            }
          } catch {}
        }
        setManagerEmployeeTrainings(allTrainings);
      });
      loadEmployees();
    } else if (role) {
      loadTrainings();
      loadEmployees();
    }
  }, [role, userId]);

  // Unified filtering logic for all roles, combining status and assigned filters
  useEffect(() => {
    let baseList: any[] = [];
    if (role === 'employee') {
      baseList = trainings;
    } else if (role === 'trainer' && showTrainerAssigned) {
      baseList = trainerAssignedTrainings;
    } else if (role === 'manager') {
      baseList = managerEmployeeTrainings;
    } else {
      baseList = trainings;
    }
    let result = baseList;
    if (status === 'Ongoing') {
      const now = new Date();
      result = result.filter(t => t.end_date && new Date(t.end_date) >= now);
    } else if (status === 'Finished') {
      const now = new Date();
      result = result.filter(t => t.end_date && new Date(t.end_date) < now);
    }
    result = result.slice().sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    setFiltered(result);
  }, [trainings, trainerAssignedTrainings, managerEmployeeTrainings, status, role, showTrainerAssigned]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      if (editId) {
        await updateTraining(editId, form);
        setMessage('Training updated!');
      } else {
        await createTraining(form);
        setMessage('Training created!');
      }
      setForm({ title: '', description: '', start_date: '', end_date: '', category: '' });
      setEditId(null);
      loadTrainings();
    } catch (e: any) {
      setError(e.message || 'Failed to save training');
    }
  };

  const handleEdit = (training: any) => {
    setForm({ ...training });
    setEditId(training.training_id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this training?')) return;
    setMessage('');
    setError('');
    try {
      await deleteTraining(id);
      setMessage('Training deleted!');
      setForm({ title: '', description: '', start_date: '', end_date: '', category: '' });
      setEditId(null);
      loadTrainings();
    } catch (e: any) {
      setError(e.message || 'Failed to delete training');
    }
  };

  const handleRequest = async (e: any) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await requestTraining(request.employee_id, request.training_id, request.recommendation_level);
      setMessage('Training requested!');
      setRequest({ employee_id: '', training_id: '', recommendation_level: 3 });
    } catch (e: any) {
      setError(e.message || 'Failed to request training');
    }
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', minWidth: 320, position: 'relative', background: '#F5F5F5', overflow: 'auto' }}>
      <NavBar />
      {/* Sidebar Filters and Manage Trainings (single sidebar) */}
      <div style={{
        width: 241,
        height: 'calc(100vh - 60px)',
        position: 'fixed',
        top: 60,
        left: 0,
        overflowY: 'auto',
        zIndex: 20,
        background: 'white',
        boxShadow: '2px 0 8px #eee',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '24px 16px 16px 16px',
      }}>
        <div style={{ width: '100%', height: 32, textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#717171', fontSize: 22, fontWeight: 400, lineHeight: '22px', marginBottom: 16 }}>Filters</div>
        <div style={{ color: '#717171', fontSize: 18, fontWeight: 400, lineHeight: '18px', marginBottom: 8 }}>
          Status
        </div>
        <select
          style={{ width: '100%', height: 35, borderRadius: 10, border: '1px #D5D5D5 solid', background: '#F5F5F5', fontSize: 18, paddingLeft: 12, marginBottom: 24 }}
          value={status}
          onChange={e => setStatus(e.target.value as 'Ongoing' | 'Finished' | 'All')}
        >
          <option value="Ongoing">Ongoing</option>
          <option value="Finished">Finished</option>
          <option value="All">All</option>
        </select>
        {/* Trainer: Option to view assigned trainings */}
        {role === 'trainer' && (
          <button
            style={{ marginBottom: 16, padding: '8px 0', borderRadius: 8, background: showTrainerAssigned ? '#3FD270' : '#eee', color: showTrainerAssigned ? '#fff' : '#333', border: 'none', fontWeight: 600, fontSize: 16 }}
            onClick={() => setShowTrainerAssigned(v => !v)}
          >
            {showTrainerAssigned ? 'All Trainings' : 'Assigned to Me'}
          </button>
        )}
        {(role === 'hradmin' || role === 'trainer') && !showTrainerAssigned && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={{ fontSize: 18, margin: '16px 0 8px 0', color: '#222' }}>Manage Trainings</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <input type="date" placeholder="Start Date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <input type="date" placeholder="End Date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', minHeight: 60, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', marginBottom: 40 }}>
                <button type="submit" style={{ flex: 1, padding: '6px 0', borderRadius: 6, background: '#3FD270', color: '#fff', border: 'none', fontWeight: 600 }}>{editId ? 'Update' : 'Create'}</button>
                {editId && (
                  <>
                    <button type="button" onClick={() => { setEditId(null); setForm({ title: '', description: '', start_date: '', end_date: '', category: '' }); }} style={{ flex: 1, borderRadius: 6, background: '#eee', color: '#333', border: 'none', fontWeight: 600 }}>Cancel</button>
                    <button type="button" onClick={() => handleDelete(editId)} style={{ flex: 1, borderRadius: 6, background: '#D9534F', color: '#fff', border: 'none', fontWeight: 600 }}>Delete</button>
                  </>
                )}
              </div>
              {(message || error) && (
                <div style={{ marginTop: 8, color: message ? 'green' : 'red', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>{message || error}</div>
              )}
            </form>
          </div>
        )}
      </div>
      {/* Trainings Cards Grid */}
      <div
        style={{
          marginLeft: 265,
          paddingLeft: 48,
          paddingTop: 120,
          paddingRight: 32,
          paddingBottom: 32, // Add bottom padding equal to gap
          display: 'flex',
          flexWrap: 'wrap',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        {(() => { console.log('Render: trainings', trainings, 'filtered', filtered, 'role', role); return null; })()}
        {filtered.length === 0 && role === 'employee' ? (
          <div style={{ gridColumn: '1/-1', color: '#D9534F', fontSize: 18, fontWeight: 600, textAlign: 'center', marginTop: 40 }}>
            No assigned trainings found for you.
          </div>
        ) : null}
        {filtered.map((training: any) => (
          <div
            key={training.training_id}
            style={{
              width: 250,
              minHeight: 200,
              background: 'white',
              borderRadius: 15,
              border: '2px #D9D9D9 solid',
              position: 'relative',
              boxSizing: 'border-box',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => { setSelectedTraining(training); setShowOverlay(true); }}
          >
            <div>
              <div style={{ color: 'black', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{training.title}</div>
              <div style={{ color: '#717171', fontSize: 12, fontWeight: 400, marginBottom: 8 }}>{training.category}</div>
              <div style={{ color: 'black', fontSize: 12, fontWeight: 400, marginBottom: 8 }}>{training.description}</div>
            </div>
            <div style={{ color: '#3FD270', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>
              {new Date(training.start_date).toLocaleDateString()} - {new Date(training.end_date).toLocaleDateString()}
            </div>
            <div style={{ color: (new Date(training.end_date) >= new Date()) ? '#3FD270' : '#D9534F', fontSize: 12, fontWeight: 600 }}>
              {(new Date(training.end_date) >= new Date()) ? 'Ongoing' : 'Finished'}
            </div>
            {(role === 'hradmin' || role === 'trainer') && (
              <div style={{ marginTop: 8 }}>
                <button onClick={e => { e.stopPropagation(); handleEdit(training); }} style={{ marginRight: 8 }}>Edit</button>
              </div>
            )}
          </div>
        ))}
        <TrainingCardOverlay
          open={showOverlay}
          onClose={() => setShowOverlay(false)}
          training={selectedTraining}
          onDetails={id => { setShowOverlay(false); router.push(`/training-details?id=${id}`); }}
        />
      </div>
      {/* Manager Request Section */}
      {role === 'manager' && (
        <div style={{ maxWidth: 900, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #eee' }}>
          <h2>Request Training for Employee</h2>
          <form onSubmit={handleRequest} style={{ marginBottom: 32 }}>
            <select value={request.employee_id} onChange={e => setRequest({ ...request, employee_id: e.target.value })} required style={{ marginRight: 8 }}>
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
            <select value={request.training_id} onChange={e => setRequest({ ...request, training_id: e.target.value })} required style={{ marginRight: 8 }}>
              <option value="">Select Training</option>
              {trainings.map(tr => (
                <option key={tr.training_id} value={tr.training_id}>{tr.title}</option>
              ))}
            </select>
            <input type="number" min={1} max={5} value={request.recommendation_level} onChange={e => setRequest({ ...request, recommendation_level: Number(e.target.value) })} style={{ width: 60, marginRight: 8 }} />
            <button type="submit" style={{ padding: '6px 16px', borderRadius: 6, background: '#3FD270', color: '#fff', border: 'none', fontWeight: 600 }}>Request</button>
          </form>
        </div>
      )}
  {/* Message display moved to sidebar only; nothing here */}
    </div>
  );
};

export default TrainingsPage;