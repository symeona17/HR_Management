import { useEffect, useState, useMemo } from 'react';
import { fetchEmployees, searchEmployees } from '../utils/api';
import { fetchManagerTeam } from '../utils/profileApi';
import NavBar from '../components/NavBar';
import AddEmployeeOverlay from '../components/AddEmployeeOverlay';
import EmployeeCardOverlay from '../components/EmployeeCardOverlay';


type Employee = {
  id?: number; // for backend compatibility
  employee_id: number;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_title: string;
  hire_date: string;
  details: string;
  level?: string;
  trainings?: string[];
  skills?: { id: number; preferred_label: string; skill_type: string; proficiency_level?: number }[];
  bio?: string;
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [department, setDepartment] = useState('Any');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeOverlay, setShowEmployeeOverlay] = useState(false);
  // For manager: always show only their team
  const [role, setRole] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [managerTeam, setManagerTeam] = useState<Employee[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const r = localStorage.getItem('user_role') || '';
      setRole(r);
      const id = localStorage.getItem('user_id');
      setUserId(id ? Number(id) : null);
    }
  }, []);

  useEffect(() => {
    if (role === 'manager' && userId) {
      fetchManagerTeam(userId).then(data => {
        setManagerTeam(Array.isArray(data.team) ? data.team : []);
      }).catch(() => setManagerTeam([]));
    } else {
      const getEmployees = async () => {
        const data = await fetchEmployees();
        console.log('Fetched employees:', data);
        // Patch: Ensure each employee has a skills array (default to empty if missing)
        const employeesWithSkills = (data.employee || []).map((emp: any) => ({ ...emp, skills: emp.skills ?? [] }));
        setEmployees(employeesWithSkills);
        setFiltered(employeesWithSkills); // Ensure filtered is set for display
      };
      getEmployees();
    }
  }, [role, userId]);
  if (role === 'trainer') {
    return (
      <div style={{ width: '100vw', minHeight: '100vh', minWidth: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5' }}>
        <NavBar />
        <div style={{ fontSize: 22, color: '#D9534F', fontWeight: 600, fontFamily: 'Montserrat', marginTop: 120 }}>
          Access Denied: Trainers are not allowed to view this page.
        </div>
      </div>
    );
  }
  return (
    <div style={{ width: '100vw', minHeight: '100vh', minWidth: 320, position: 'relative', background: '#F5F5F5', overflow: 'auto' }}>
      <NavBar />
      {/* Sidebar Filters */}
      <div style={{
        width: 241,
        height: '100vh',
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
          Department
        </div>
        <select
          style={{ width: '100%', height: 35, borderRadius: 10, border: '1px #D5D5D5 solid', background: '#F5F5F5', fontSize: 18, paddingLeft: 12, marginBottom: 24 }}
          value={department}
          onChange={e => setDepartment(e.target.value)}
        >
          <option value="Any">Any</option>
          {useMemo(() => {
            const set = new Set<string>();
            (role === 'manager' ? managerTeam : employees).forEach(emp => set.add(emp.department));
            return Array.from(set);
          }, [employees, managerTeam, role]).map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
        {/* Add Employee Button only for hradmin, fixed distance from bottom */}
        {role === 'hradmin' && (
          <div style={{ marginTop: 'auto', marginBottom: 100 }}>
            <button
              style={{
                width: '100%',
                height: 40,
                background: '#3FD270',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                zIndex: 30,
              }}
              onClick={() => setShowAdd(true)}
            >
              Add Employee
            </button>
          </div>
        )}
      </div>
      <AddEmployeeOverlay
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => setShowAdd(false)}
        fetchEmployees={async () => {
          const data = await fetchEmployees();
          // Patch: Ensure each employee has a skills array (default to empty if missing)
          const employeesWithSkills = (data.employee || []).map((emp: any) => ({ ...emp, skills: emp.skills ?? [] }));
          setEmployees(employeesWithSkills);
          setFiltered(employeesWithSkills);
        }}
        departments={useMemo(() => {
          const set = new Set<string>();
          (role === 'manager' ? managerTeam : employees).forEach(emp => set.add(emp.department));
          return Array.from(set);
        }, [employees, managerTeam, role])}
      />
      {/* Employee Cards Flex Container */}
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
        {(role === 'manager' ? managerTeam : filtered).map(emp => (
          <div
            key={emp.employee_id}
            style={{
              width: 250,
              height: 250,
              background: 'white',
              borderRadius: 15,
              border: '2px #D9D9D9 solid',
              position: 'relative',
              boxSizing: 'border-box',
              padding: 16,
              cursor: 'pointer',
            }}
            onClick={async () => {
              // Use either emp.employee_id or emp.id, fallback to emp
              const empId = emp.employee_id ?? emp.id;
              if (empId === undefined) {
                setSelectedEmployee(emp);
                setShowEmployeeOverlay(true);
                return;
              }
              try {
                const data = await import('../utils/api').then(m => m.fetchEmployeeById(empId));
                setSelectedEmployee(data);
                setShowEmployeeOverlay(true);
              } catch (e) {
                setSelectedEmployee(emp);
                setShowEmployeeOverlay(true);
              }
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* Profile Image */}
              <div
                style={{
                  width: 70,
                  height: 70,
                  background: '#D9D9D9',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  marginBottom: 8,
                  position: 'relative',
                }}
              >
                <img
                  src="/employee.png"
                  alt="profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
              {/* Info */}
              <div style={{ marginLeft: 16, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                <div style={{ color: 'black', fontSize: 14, fontWeight: 500 }}>
                  {emp.first_name} {emp.last_name}
                </div>
                <div style={{ color: 'black', fontSize: 10, fontWeight: 400 }}>
                  {emp.department}
                </div>
                <div style={{ color: 'black', fontSize: 10, fontWeight: 400 }}>
                  {emp.job_title}<br />Joined {emp.hire_date}
                </div>
              </div>
            </div>
            {/* Email below image, left-aligned */}
            <div style={{ color: '#555', fontSize: 12, fontWeight: 400, marginLeft: 2 }}>{emp.email}</div>
          </div>
        ))}
      </div>
      <EmployeeCardOverlay
        open={showEmployeeOverlay}
        onClose={() => setShowEmployeeOverlay(false)}
        employee={selectedEmployee}
      />
    </div>
  );
};

export default EmployeesPage;