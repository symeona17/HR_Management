import React, { useState } from 'react';

type NewEmployee = {
  first_name: string;
  last_name: string;
  email: string;
  hire_date: string;
  department: string;
  job_title: string;
};

type AddEmployeeOverlayProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  fetchEmployees: () => Promise<void>;
};

const AddEmployeeOverlay: React.FC<AddEmployeeOverlayProps> = ({ open, onClose, onSuccess, fetchEmployees }) => {
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    first_name: '',
    last_name: '',
    email: '',
    hire_date: '',
    department: '',
    job_title: '',
  });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.3)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 32, minWidth: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        <h2 style={{ margin: 0, marginBottom: 18, fontFamily: 'Montserrat', fontWeight: 700 }}>Add Employee</h2>
        <form onSubmit={async e => {
          e.preventDefault();
          setAdding(true);
          setError(null);
          setSuccess(false);
          try {
            const res = await fetch('http://localhost:8000/employee/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newEmployee),
            });
            if (!res.ok) {
              let msg = 'Failed to add employee';
              try {
                const data = await res.json();
                if (data && data.detail) msg = data.detail;
              } catch {}
              throw new Error(msg);
            }
            setSuccess(true);
            setNewEmployee({ first_name: '', last_name: '', email: '', hire_date: '', department: '', job_title: '' });
            await fetchEmployees();
            setTimeout(() => {
              setSuccess(false);
              onSuccess();
            }, 1000);
          } catch (err: any) {
            setError(err.message || 'Error');
          } finally {
            setAdding(false);
          }
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input required placeholder="First Name" value={newEmployee.first_name} onChange={e => setNewEmployee({ ...newEmployee, first_name: e.target.value })} style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            <input required placeholder="Last Name" value={newEmployee.last_name} onChange={e => setNewEmployee({ ...newEmployee, last_name: e.target.value })} style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            <input required type="email" placeholder="Email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            <input required type="date" placeholder="Hire Date" value={newEmployee.hire_date} onChange={e => setNewEmployee({ ...newEmployee, hire_date: e.target.value })} style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            <input required placeholder="Department" value={newEmployee.department} onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })} style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            <input required placeholder="Job Title" value={newEmployee.job_title} onChange={e => setNewEmployee({ ...newEmployee, job_title: e.target.value })} style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            {error && <div style={{ color: 'red', fontSize: 13 }}>{error}</div>}
            {success && <div style={{ color: 'green', fontSize: 15, fontWeight: 600 }}>Employee added successfully!</div>}
            <button type="submit" disabled={adding || success} style={{ marginTop: 8, background: '#3FD270', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, padding: '10px 0', cursor: 'pointer' }}>{adding ? 'Adding...' : success ? 'Success!' : 'Submit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeOverlay;
