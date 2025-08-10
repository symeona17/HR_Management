
import NavBar from '../components/NavBar';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { fetchEmployeeById } from '../utils/api';

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

const EmployeeDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // Log the id for debugging
    console.log('Employee details page id:', id);
    const employeeId = Array.isArray(id) ? id[0] : id;
    if (!employeeId || employeeId === 'undefined') {
      setError('Invalid employee ID.');
      setEmployee(null);
      return;
    }
    fetchEmployeeById(employeeId)
      .then(data => {
        setEmployee(data || null);
        setError(null);
      })
      .catch(err => {
        setError('Failed to fetch employee: ' + err.message);
        setEmployee(null);
      });
  }, [id]);

  if (error) return <div style={{ color: 'red', padding: 24 }}>{error}</div>;
  if (!employee) return <div>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', minWidth: 320 }}>
      <NavBar />
      <div style={{ height: 120, background: '#F5F5F5' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, display: 'flex', gap: 40, flexWrap: 'wrap', background: 'white', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        {/* Left: Profile and basic info */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 180, height: 180, background: '#D9D9D9', borderRadius: '50%', overflow: 'hidden', marginBottom: 12 }}>
            <img src="/employee.png" alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: 28, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center' }}>{employee.first_name} {employee.last_name}</div>
          <div style={{ fontSize: 18, fontFamily: 'Montserrat', fontWeight: 400, color: '#555', textAlign: 'center' }}>{employee.department}</div>
          <div style={{ fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, color: '#555', textAlign: 'center' }}>{employee.level || 'Senior level'}<br />Joined {employee.hire_date}</div>
        </div>
        {/* Right: Details */}
        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 26, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>About {employee.first_name}</div>
          <div style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#333', lineHeight: '1.7', textAlign: 'justify', marginBottom: 16 }}>{employee.details}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
            {/* Trainings */}
            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: 20, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>Current Trainings</div>
              <div style={{ fontSize: 15, fontFamily: 'Montserrat', color: '#333', marginBottom: 8 }}>Cybersecurity: 85%</div>
              <div style={{ fontSize: 15, fontFamily: 'Montserrat', color: '#333', marginBottom: 8 }}>Time Management: 85%</div>
            </div>
            {/* Skills */}
            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: 20, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>Skills</div>
              <div style={{ fontSize: 15, fontFamily: 'Montserrat', color: '#333', whiteSpace: 'pre-line' }}>
                {(employee.skills || []).map(skill => `${skill.name}: ${skill.rating}/5`).join('\n')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
