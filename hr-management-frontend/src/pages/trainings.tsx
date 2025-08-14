
import React, { useState, useEffect } from 'react';
import NavBar from '../components/NavBar';
import { fetchTrainings, createTraining, updateTraining, deleteTraining, fetchEmployees, requestTraining } from '../utils/api';

const TrainingsPage: React.FC = () => {
  const [trainings, setTrainings] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [status, setStatus] = useState<'Ongoing' | 'Finished' | 'All'>('All');
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', category: '' });
  const [editId, setEditId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [request, setRequest] = useState({ employee_id: '', training_id: '', recommendation_level: 3 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    setRole(localStorage.getItem('user_role') || '');
  }, []);

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
    loadTrainings();
    loadEmployees();
  }, []);

  useEffect(() => {
    const now = new Date();
    let result = trainings;
    if (status === 'Ongoing') {
      result = trainings.filter(t => t.end_date && new Date(t.end_date) >= now);
    } else if (status === 'Finished') {
      result = trainings.filter(t => t.end_date && new Date(t.end_date) < now);
    }
    result = result.slice().sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    setFiltered(result);
  }, [status, trainings]);

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
        overflow: 'auto',
        zIndex: 20,
        background: 'white',
        borderRight: '1px #D9D9D9 solid',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        padding: '24px 16px 16px 16px',
        boxShadow: '2px 0 8px #eee'
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
        {(role === 'hradmin' || role === 'trainer') && (
          <div style={{ width: '100%' }}>
            <h3 style={{ fontSize: 18, margin: '16px 0 8px 0', color: '#222' }}>Manage Trainings</h3>
            <form onSubmit={handleSubmit} style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <input type="text" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <input type="date" placeholder="Start Date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <input type="date" placeholder="End Date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }} />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', minHeight: 60, resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8 }}>
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 250px)',
            gap: 32,
            justifyItems: 'start',
        }}
      >
        {filtered.map(training => (
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
            }}
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
                <button onClick={() => handleEdit(training)} style={{ marginRight: 8 }}>Edit</button>
              </div>
            )}
          </div>
        ))}
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