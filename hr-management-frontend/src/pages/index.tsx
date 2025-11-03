import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import AddEmployeeOverlay from '../components/AddEmployeeOverlay';
import { fetchEmployees, fetchTrainings, fetchAllFeedback } from '../utils/api';
import { fmtNumber } from '../utils/format';


const Home: React.FC = () => {
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [ongoingTrainings, setOngoingTrainings] = useState<number | null>(null);
  const [ongoingTrainingsList, setOngoingTrainingsList] = useState<any[]>([]);
  const [completedTrainingsList, setCompletedTrainingsList] = useState<any[]>([]);
  // Placeholder for training requests
  const [trainingRequestsList] = useState<any[]>([]);
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentsCount, setDepartmentsCount] = useState<number | null>(null);
  const [topDepartments, setTopDepartments] = useState<Array<{ dept: string; count: number }>>([]);
  const [role, setRole] = useState('');
  const [feedback, setFeedback] = useState<any[]>([]);
  const [avgSentiment, setAvgSentiment] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(localStorage.getItem('user_role') || '');
    }
  }, []);

  // Fetch feedback for admin dashboard
  useEffect(() => {
    if (role === 'hradmin') {
      // Fetch both feedback and employees, then join info
      Promise.all([fetchAllFeedback(), fetchEmployees()])
        .then(([feedbackData, employeesData]) => {
          let feedbackArr = Array.isArray(feedbackData) ? feedbackData : [];
          let empArr = Array.isArray(employeesData.employee) ? employeesData.employee : [];
          // Build a map of employee_id to { full_name, department }
          const empMap: Record<string, { full_name: string; department: string }> = {};
          empArr.forEach((emp: any) => {
            const id = emp.employee_id || emp.id;
            if (id) {
              empMap[id] = {
                full_name: emp.full_name || (emp.first_name ? (emp.first_name + (emp.last_name ? ' ' + emp.last_name : '')) : ''),
                department: emp.department || emp.dept || '-'
              };
            }
          });
          // Attach name and department to each feedback
          feedbackArr = feedbackArr.map((fb: any) => {
            const id = fb.employee_id || fb.id;
            const empInfo = empMap[id] || {};
            return {
              ...fb,
              full_name: empInfo.full_name || fb.full_name || fb.employee_name || '-',
              department: empInfo.department || fb.department || '-',
            };
          });
          setFeedback(feedbackArr);
          if (feedbackArr.length > 0) {
            const avg = feedbackArr.reduce((sum, f) => sum + (typeof f.sentiment_score === 'number' ? f.sentiment_score : 0), 0) / feedbackArr.length;
            setAvgSentiment(avg);
            // compute top departments by feedback count
            const deptCounts: Record<string, number> = {};
            feedbackArr.forEach((f: any) => {
              const d = f.department || '-';
              deptCounts[d] = (deptCounts[d] || 0) + 1;
            });
            const top = Object.entries(deptCounts).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count).slice(0, 3);
            setTopDepartments(top);
          } else {
            setAvgSentiment(null);
            setTopDepartments([]);
          }
        })
        .catch(() => {
          setFeedback([]);
          setAvgSentiment(null);
        });
    }
  }, [role]);

  useEffect(() => {
    const getTotalEmployees = async () => {
      try {
        const data = await fetchEmployees();
        setTotalEmployees(Array.isArray(data.employee) ? data.employee.length : 0);
        // Collect unique departments
        if (Array.isArray(data.employee)) {
          const set = new Set<string>();
          data.employee.forEach((emp: any) => set.add(emp.department));
          setDepartments(Array.from(set));
          setDepartmentsCount(Array.from(set).filter(Boolean).length);
        }
      } catch (e) {
        setTotalEmployees(null);
      }
    };
    getTotalEmployees();
  }, []);

  useEffect(() => {
    const getTrainings = async () => {
      try {
        const data = await fetchTrainings();
        const now = new Date();
        let ongoingList: any[] = [];
        let completedList: any[] = [];
        if (Array.isArray(data.trainings)) {
          ongoingList = data.trainings.filter((t: any) => t.end_date && new Date(t.end_date) >= now);
          completedList = data.trainings.filter((t: any) => t.end_date && new Date(t.end_date) < now);
        }
        setOngoingTrainings(ongoingList.length);
        setOngoingTrainingsList(ongoingList);
        setCompletedTrainingsList(completedList);
      } catch (e) {
        setOngoingTrainings(null);
        setOngoingTrainingsList([]);
        setCompletedTrainingsList([]);
      }
    };
    getTrainings();
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: 600,
        minWidth: 320,
        position: 'relative',
        background: '#F5F5F5',
        overflow: 'auto',
      }}
    >
      <NavBar />
      {/* Cards Flex Layout */}
      <div
        style={{
          marginTop: 100,
          padding: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '32px',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          paddingBottom: 32, // Add bottom padding equal to gap
        }}
      >
        {/* Overview Card */}
        <div style={{ width: 300, height: 400, background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, boxSizing: 'border-box' }}>
          <div style={{ color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, marginBottom: 24 }}>Overview</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', rowGap: 16, columnGap: 8, width: '100%' }}>
            <div style={{ color: 'black', fontSize: 18, fontWeight: 700, textAlign: 'right' }}>{totalEmployees !== null ? totalEmployees : '...'}</div>
            <div style={{ color: 'black', fontSize: 14, fontWeight: 400, alignSelf: 'center' }}>Total Employees</div>
            <div style={{ color: 'black', fontSize: 18, fontWeight: 700, textAlign: 'right' }}>{ongoingTrainings !== null ? ongoingTrainings : '...'}</div>
            <div style={{ color: 'black', fontSize: 14, fontWeight: 400, alignSelf: 'center' }}>Ongoing Trainings</div>
            <div style={{ color: 'black', fontSize: 18, fontWeight: 700, textAlign: 'right' }}>{departmentsCount !== null ? departmentsCount : '...'}</div>
            <div style={{ color: 'black', fontSize: 14, fontWeight: 400, alignSelf: 'center' }}>Departments</div>
            <div style={{ color: 'black', fontSize: 18, fontWeight: 700, textAlign: 'right' }}>{avgSentiment !== null ? fmtNumber(avgSentiment) : 'N/A'}</div>
            <div style={{ color: 'black', fontSize: 14, fontWeight: 400, alignSelf: 'center' }}>Avg Sentiment</div>
          </div>
        </div>
        {/* Quick Actions Card (moved up) */}
        <div style={{ width: 300, height: 400, background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, boxSizing: 'border-box' }}>
          <div style={{ color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <button
              style={{ width: '100%', height: 54, background: '#F5F5F5', borderRadius: 5, border: '1.5px #D9D9D9 solid', color: 'black', fontSize: 14, fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }}
              onClick={() => setShowAdd(true)}
            >
              Add New Employee
            </button>
            <button
              style={{ width: '100%', height: 54, background: '#F5F5F5', borderRadius: 5, border: '1.5px #D9D9D9 solid', color: 'black', fontSize: 14, fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }}
            >
              Assign Training
            </button>
            <button
              style={{ width: '100%', height: 54, background: '#F5F5F5', borderRadius: 5, border: '1.5px #D9D9D9 solid', color: 'black', fontSize: 14, fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }}
              onClick={() => router.push('/analytics')}
            >
              Generate Report
            </button>
            <button
              style={{ width: '100%', height: 54, background: '#F5F5F5', borderRadius: 5, border: '1.5px #D9D9D9 solid', color: 'black', fontSize: 14, fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }}
              onClick={() => router.push('/analytics')}
            >
              Export Data
            </button>
          </div>
        </div>
        {/* Training Insights Card */}
        <div
          style={{ width: 300, height: 400, background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, boxSizing: 'border-box', cursor: 'pointer' }}
          onClick={() => router.push('/trainings')}
        >
          <div style={{ color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, marginBottom: 16 }}>Training Insights</div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ color: 'black', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Ongoing Trainings</div>
              <div style={{ color: 'black', fontSize: 14, fontWeight: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {ongoingTrainingsList.length === 0 && <span>No ongoing trainings</span>}
                {ongoingTrainingsList.slice(0, 2).map((t, idx) => (
                  <span key={idx}>{t.title || t.name || t.training_name || 'Untitled Training'}</span>
                ))}
                {ongoingTrainingsList.length > 3 && (
                  <span style={{ color: '#1976d2', fontWeight: 500, marginTop: 4 }}>Show More...</span>
                )}
              </div>
            </div>
            <div>
              <div style={{ color: 'black', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Training Requests</div>
              <div style={{ color: 'black', fontSize: 14, fontWeight: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {trainingRequestsList.length === 0 && <span>No requests</span>}
                {trainingRequestsList.slice(0, 2).map((t, idx) => (
                  <span key={idx}>{t.title || t.name || t.training_name || 'Untitled Training'}</span>
                ))}
                {trainingRequestsList.length > 3 && (
                  <span style={{ color: '#1976d2', fontWeight: 500, marginTop: 4 }}>Show More...</span>
                )}
              </div>
            </div>
            <div>
              <div style={{ color: 'black', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Completed Trainings</div>
              <div style={{ color: 'black', fontSize: 14, fontWeight: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {completedTrainingsList.length === 0 && <span>No completed trainings</span>}
                {completedTrainingsList.slice(0, 2).map((t, idx) => (
                  <span key={idx}>{t.title || t.name || t.training_name || 'Untitled Training'}</span>
                ))}
                {completedTrainingsList.length > 3 && (
                  <span style={{ color: '#1976d2', fontWeight: 500, marginTop: 4 }}>Show More...</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Feedback & Sentiment Analytics Card (Admin only) */}
        {role === 'hradmin' && (
          <div style={{ width: 560, minHeight: 400, height: 400, background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, paddingBottom: 40, boxSizing: 'border-box' }}>
            <div style={{ color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, marginBottom: 16 }}>Feedback & Sentiment</div>
            <div style={{ color: '#1976d2', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Latest feedback submitted:
            </div>
            <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginBottom: 8, overflow: 'hidden' }}>
              <table style={{ width: '100%', height: '100%', fontSize: 13, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: 6, borderBottom: '1px solid #eee', width: '32%' }}>Full Name</th>
                    <th style={{ padding: 6, borderBottom: '1px solid #eee', width: '22%' }}>Department</th>
                    <th style={{ padding: 6, borderBottom: '1px solid #eee', width: '26%' }}>Date</th>
                    <th style={{ padding: 6, borderBottom: '1px solid #eee', width: '20%' }}>Sentiment</th>
                  </tr>
                </thead>
                <tbody style={{ height: '100%' }}>
                  {feedback.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: 16, color: '#888' }}>No feedback data</td>
                    </tr>
                  )}
                  {feedback.slice(0, 5).map((f, i) => {
                    // Try to get the employee's name and department from the feedback object
                    let name = '-';
                    if (f.full_name) name = f.full_name;
                    else if (f.employee_name) name = f.employee_name;
                    else if (f.first_name || f.last_name) name = `${f.first_name || ''} ${f.last_name || ''}`.trim();
                    let dept = '-';
                    if (f.department) dept = f.department;
                    else if (f.dept) dept = f.dept;
                    // Get employee id for navigation
                    const empId = f.employee_id || f.id;
                    return (
                      <tr
                        key={i}
                        style={{ height: '36px', cursor: empId ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (empId) router.push(`/employee-details?id=${empId}`);
                        }}
                        tabIndex={empId ? 0 : -1}
                        title={empId ? 'View employee details' : ''}
                      >
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{name}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{dept}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{f.feedback_date}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{fmtNumber(f.sentiment_score)}</td>
                      </tr>
                    );
                  })}
                  {Array.from({ length: Math.max(0, 5 - feedback.length) }).map((_, idx) => (
                    <tr key={feedback.length + idx} style={{ height: '36px' }}>
                      <td style={{ padding: 6 }}>&nbsp;</td>
                      <td style={{ padding: 6 }}>&nbsp;</td>
                      <td style={{ padding: 6 }}>&nbsp;</td>
                      <td style={{ padding: 6 }}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button style={{ marginTop: 8, background: '#F5F5F5', border: '1.5px #D9D9D9 solid', borderRadius: 5, padding: '8px 16px', fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }} onClick={() => router.push('/analytics')}>View Full Feedback Analytics</button>
          </div>
        )}
      </div>
      <AddEmployeeOverlay
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={async () => {
          setShowAdd(false);
          // Refresh employee count and departments
          try {
            const data = await fetchEmployees();
            setTotalEmployees(Array.isArray(data.employee) ? data.employee.length : 0);
            if (Array.isArray(data.employee)) {
              const set = new Set<string>();
              data.employee.forEach((emp: any) => set.add(emp.department));
              setDepartments(Array.from(set));
            }
          } catch {}
        }}
        fetchEmployees={async () => {
          const data = await fetchEmployees();
          setTotalEmployees(Array.isArray(data.employee) ? data.employee.length : 0);
          if (Array.isArray(data.employee)) {
            const set = new Set<string>();
            data.employee.forEach((emp: any) => set.add(emp.department));
            setDepartments(Array.from(set));
          }
        }}
        departments={departments}
      />
    </div>
  );
};

export default Home;

// Redirect to /login immediately on first load
export async function getServerSideProps(context: any) {
  return {
    redirect: {
      destination: '/login',
      permanent: false,
    },
  };
}
