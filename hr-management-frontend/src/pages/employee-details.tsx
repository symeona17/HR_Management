import NavBar from '../components/NavBar';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { fetchEmployeeById, updateEmployee, deleteEmployee } from '../utils/api';

type Employee = {
  id?: number; // for backend compatibility
  employee_id?: number; // for frontend compatibility
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_title: string;
  hire_date: string;
  details: string;
  level?: string;
  trainings?: string[];
	skills?: { id: number; name: string; category: string; proficiency_level?: number }[];
  bio?: string;
};

const EmployeeDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  useEffect(() => {
    setRole(localStorage.getItem('user_role') || '');
  }, []);

  useEffect(() => {
    if (!id) return;
    const employeeId = Array.isArray(id) ? id[0] : id;
    if (!employeeId || employeeId === 'undefined') {
      setError('Invalid employee ID.');
      setEmployee(null);
      return;
    }
    setLoading(true);
    fetchEmployeeById(employeeId)
      .then(data => {
        setEmployee(data || null);
        setForm(data || {});
        setError(null);
      })
      .catch(err => {
        setError('Failed to fetch employee: ' + err.message);
        setEmployee(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return <div style={{ color: 'red', padding: 24 }}>{error}</div>;
  if (loading || !employee) return <div>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', minWidth: 320 }}>
      <NavBar />
      <div style={{ height: 120, background: '#F5F5F5' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, display: 'flex', gap: 40, flexWrap: 'wrap', background: 'white', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', position: 'relative' }}>
        {/* Edit button for hradmin */}
        {role === 'hradmin' && !editMode && (
          <button onClick={() => setEditMode(true)} style={{ position: 'absolute', top: 24, right: 24, background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer', zIndex: 2 }}>Edit</button>
        )}
        {/* Left: Profile and basic info */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 180, height: 180, background: '#D9D9D9', borderRadius: '50%', overflow: 'hidden', marginBottom: 12 }}>
            <img src="/employee.png" alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {editMode ? (
            <>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} style={{ fontSize: 24, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} />
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} style={{ fontSize: 24, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} placeholder="Email" />
              <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} />
              <input value={form.level || ''} onChange={e => setForm({ ...form, level: e.target.value })} style={{ fontSize: 14, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} placeholder="Level" />
              <input
                type="date"
                value={form.hire_date}
                onChange={e => setForm({ ...form, hire_date: e.target.value })}
                style={{ fontSize: 14, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }}
                placeholder="Hire Date"
              />
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center' }}>{employee.first_name} {employee.last_name}</div>
              <div style={{ fontSize: 15, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 2 }}>{employee.email}</div>
              <div style={{ fontSize: 18, fontFamily: 'Montserrat', fontWeight: 400, color: '#555', textAlign: 'center' }}>{employee.department}</div>
              <div style={{ fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, color: '#555', textAlign: 'center' }}>{employee.level || 'Senior level'}<br />Joined {employee.hire_date}</div>
            </>
          )}
        </div>
        {/* Right: Details */}
        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 26, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>About {employee.first_name}</div>
          {editMode ? (
            <textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#333', lineHeight: '1.7', textAlign: 'justify', marginBottom: 16, borderRadius: 6, border: '1px solid #ccc', padding: 8, minHeight: 80 }} />
          ) : (
            <div style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#333', lineHeight: '1.7', textAlign: 'justify', marginBottom: 16 }}>{employee.details}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
            {/* Trainings */}
            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: 20, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>Current Trainings</div>
              {(employee.trainings || []).length === 0
                ? <div>No ongoing trainings</div>
                : (employee.trainings || []).map((t, i) => (
                    <div key={i}>{t}</div>
                  ))
              }
            </div>
            {/* Skills */}
            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: 20, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>Skills</div>
              <ul style={{ fontSize: 15, fontFamily: 'Montserrat', color: '#333', margin: 0 }}>
                {(employee.skills || []).length === 0 && <li>No skills listed</li>}
                  {(employee.skills || []).map(skill => (<li key={skill.id}>{skill.name} <span style={{ color: '#888', fontSize: 13 }}>({skill.category})</span>
                    {typeof skill.proficiency_level !== 'undefined' && (<span style={{ color: '#3FD270', fontSize: 13, marginLeft: 8 }}>Proficiency: {skill.proficiency_level}</span>)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Edit/Save/Cancel/Delete buttons for hradmin */}
          {role === 'hradmin' && editMode && (
            <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
              <button onClick={async () => {
                setLoading(true);
                try {
                  const empId = employee.id ?? employee.employee_id;
                  if (empId === undefined) {
                    setError('Employee ID is missing.');
                    setLoading(false);
                    return;
                  }
                  await updateEmployee(empId, form);
                  setEditMode(false);
                  // Refetch updated data
                  const refetchId = employee.id ?? employee.employee_id;
                  if (refetchId === undefined) {
                    setError('Employee ID is missing.');
                    setLoading(false);
                    return;
                  }
                  const updated = await fetchEmployeeById(refetchId);
                  setEmployee(updated);
                  setForm(updated);
                } catch (err: any) {
                  setError('Failed to update employee: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }} style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setEditMode(false); setForm(employee); }} style={{ background: '#888', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (!window.confirm('Are you sure you want to delete this employee?')) return;
                setLoading(true);
                try {
                  const empId = employee.id ?? employee.employee_id;
                  if (empId === undefined) {
                    setError('Employee ID is missing.');
                    setLoading(false);
                    return;
                  }
                  await deleteEmployee(empId);
                  router.push('/employees');
                } catch (err: any) {
                  setError('Failed to delete employee: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }} style={{ background: '#d32f2f', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
