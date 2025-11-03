import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, apiFetch } from '../utils/api';

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
  departments: string[];
};

const AddEmployeeOverlay: React.FC<AddEmployeeOverlayProps> = ({ open, onClose, onSuccess, fetchEmployees, departments }) => {
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
  const [deptDropdown, setDeptDropdown] = useState(false);
  const deptInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // Close overlay when clicking outside modal
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideModal = modalRef.current && modalRef.current.contains(target);
      const clickedInsideDropdown = deptDropdownRef.current && deptDropdownRef.current.contains(target);
      const clickedInsideInput = deptInputRef.current && deptInputRef.current.contains(target);
      if (!clickedInsideModal && !clickedInsideDropdown && !clickedInsideInput) {
        onClose();
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [open, onClose]);


  // For smooth fade/blur transition
  const [show, setShow] = useState(open);
  const [animateIn, setAnimateIn] = useState(false);
  useEffect(() => {
    if (open) {
      setShow(true);
      // trigger animation on next tick
      setTimeout(() => setAnimateIn(true), 10);
    } else {
      setAnimateIn(false);
      const timeout = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  if (!show && !open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: open ? 'blur(6px)' : 'blur(0px)',
          WebkitBackdropFilter: open ? 'blur(6px)' : 'blur(0px)',
          opacity: open ? 1 : 0,
          transition: 'opacity 200ms ease, backdrop-filter 200ms ease',
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
      />
      <div
        ref={modalRef}
        style={{
          background: 'white',
          borderRadius: 12,
          padding: 32,
          minWidth: 340,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          position: 'relative',
          zIndex: 1001,
          transition: 'transform 200ms cubic-bezier(.4,2,.6,1), opacity 200ms',
          transform: animateIn ? 'scale(1)' : 'scale(0.98)',
          opacity: animateIn ? 1 : 0,
        }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        <h2 style={{ margin: 0, marginBottom: 18, fontFamily: 'Montserrat', fontWeight: 700 }}>Add Employee</h2>
        <form onSubmit={async e => {
          e.preventDefault();
          setAdding(true);
          setError(null);
          setSuccess(false);
          try {
            const res = await apiFetch(`${API_BASE_URL}/employee/`, {
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
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                required
                ref={deptInputRef}
                placeholder="Department"
                value={newEmployee.department}
                onChange={e => {
                  setNewEmployee({ ...newEmployee, department: e.target.value });
                  setDeptDropdown(true);
                }}
                onFocus={() => setDeptDropdown(true)}
                onBlur={() => setTimeout(() => setDeptDropdown(false), 120)}
                style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
                autoComplete="off"
                onPointerDown={e => e.stopPropagation()}
              />
              {deptDropdown && departments.length > 0 && newEmployee.department && (
                <div
                  ref={deptDropdownRef}
                  onPointerDown={e => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 38,
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    zIndex: 10,
                    maxHeight: 150,
                    overflowY: 'auto',
                  }}>
                  {departments.filter(dep => {
                    if (!newEmployee.department) return false;
                    return dep && dep.toLowerCase().includes(newEmployee.department.toLowerCase()) && dep.trim() !== '';
                  }).length === 0 ? (
                    <div style={{ padding: 8, color: '#888', fontSize: 14 }}>No matches</div>
                  ) : (
                    departments.filter(dep => {
                      if (!newEmployee.department) return false;
                      return dep && dep.toLowerCase().includes(newEmployee.department.toLowerCase()) && dep.trim() !== '';
                    }).map(dep => (
                      <div
                        key={dep}
                        style={{ padding: 8, cursor: 'pointer', fontSize: 15, borderBottom: '1px solid #f0f0f0' }}
                        onMouseDown={e => {
                          e.preventDefault();
                          setNewEmployee({ ...newEmployee, department: dep });
                          setDeptDropdown(false);
                          deptInputRef.current?.blur();
                        }}
                      >
                        {dep}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <input required placeholder="Job Title" value={newEmployee.job_title} onChange={e => setNewEmployee({ ...newEmployee, job_title: e.target.value })} style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <label htmlFor="hire-date" style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>Hire Date</label>
              <input
                id="hire-date"
                required
                type="date"
                value={newEmployee.hire_date}
                onChange={e => setNewEmployee({ ...newEmployee, hire_date: e.target.value })}
                style={{ padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #ccc' }}
              />
            </div>
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
