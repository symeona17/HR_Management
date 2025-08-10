import { useEffect, useState, useMemo } from 'react';
import { fetchEmployees, searchEmployees } from '../utils/api';
import NavBar from '../components/NavBar';
import AddEmployeeOverlay from '../components/AddEmployeeOverlay';
import EmployeeCardOverlay from '../components/EmployeeCardOverlay';


type Employee = {
  employee_id: number;
  first_name: string;
  last_name: string;
  department: string;
  job_title: string;
  hire_date: string;
  details: string;
  level?: string;
  trainings?: string[];
  skills?: { name: string; rating: number }[];
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

  useEffect(() => {
    const getEmployees = async () => {
      const data = await fetchEmployees();
      setEmployees(data.employee);
      setFiltered(data.employee);
    };
    getEmployees();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(emp => set.add(emp.department));
    return Array.from(set);
  }, [employees]);

  useEffect(() => {
    const doSearch = async () => {
      // If no search and department is Any, just show all
      if (search.trim() === '' && department === 'Any') {
        setFiltered(employees);
        return;
      }
      // Build query params for backend search
      const params: any = {};
      if (search.trim() !== '') {
        // Use search as name, surname, email, department, and job_title for backend search
        params.name = search;
        params.surname = search;
        params.email = search;
        params.department = department !== 'Any' ? department : search;
        params.job_title = search;
      }
      if (department !== 'Any') {
        params.department = department;
      }
      try {
        const data = await searchEmployees(params);
        setFiltered((data.employees && data.employees.employee) || []);
      } catch (err) {
        setFiltered([]);
      }
    };
    doSearch();
  }, [department, search, employees]);

  return (
    <div style={{ width: '100vw', minHeight: '100vh', minWidth: 320, position: 'relative', background: '#F5F5F5', overflow: 'auto' }}>
      <NavBar showSearch onSearchChange={setSearch} />
      {/* Employee Details Overlay */}
      <EmployeeCardOverlay
        open={showEmployeeOverlay}
        onClose={() => setShowEmployeeOverlay(false)}
        employee={selectedEmployee}
      />
      {/* Sidebar Filters */}
      <div style={{
        width: 241,
        height: 'calc(100vh - 60px)',
        position: 'fixed',
        top: 60,
        left: 0,
        overflow: 'hidden',
        zIndex: 20,
      }}>
        <div style={{ width: 241, height: '100%', left: 0, top: 0, position: 'absolute', background: 'white', border: '1px #D9D9D9 solid' }} />
        <div style={{ width: 78, height: 32, left: 96, top: 63, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: '#717171', fontSize: 22, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '22px' }}>Filters</div>
        <div style={{ position: 'absolute', left: 31, top: 115, color: '#717171', fontSize: 18, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '18px' }}>
          Department
        </div>
        <select
          style={{ position: 'absolute', left: 31, top: 139, width: 181, height: 35, borderRadius: 10, border: '1px #D5D5D5 solid', background: '#F5F5F5', fontSize: 18, fontFamily: 'Montserrat', paddingLeft: 12 }}
          value={department}
          onChange={e => setDepartment(e.target.value)}
        >
          <option value="Any">Any</option>
          {departments.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
        {/* Add Employee Button */}
        <button
          style={{
            position: 'absolute',
            left: 31,
            bottom: 32,
            width: 181,
            height: 40,
            background: '#3FD270',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontFamily: 'Montserrat',
            fontWeight: 600,
            cursor: 'pointer',
            zIndex: 30,
          }}
          onClick={() => setShowAdd(true)}
        >
          Add Employee
        </button>
      </div>
      <AddEmployeeOverlay
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={() => setShowAdd(false)}
        fetchEmployees={async () => {
          const data = await fetchEmployees();
          setEmployees(data.employee);
          setFiltered(data.employee);
        }}
        departments={departments}
      />
      {/* Employee Cards Grid */}
      <div
        style={{
            marginLeft: 241,
            paddingLeft: 32,
            paddingTop: 120,
            paddingRight: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 250px)',
            gap: 32,
            justifyItems: 'start',
        }}
      >
        {filtered.map(emp => (
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
            onClick={() => {
              setSelectedEmployee(emp);
              setShowEmployeeOverlay(true);
            }}
          >
            {/* Profile Image in Gray Circle */}
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
            <div style={{ marginLeft: 80, marginTop: -70, position: 'relative' }}>
              <div style={{ color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 500 }}>
                {emp.first_name} {emp.last_name}
              </div>
              <div style={{ color: 'black', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 400 }}>
                {emp.department}
              </div>
              <div style={{ color: 'black', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 400 }}>
                {emp.job_title}<br />Joined {emp.hire_date}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeesPage;