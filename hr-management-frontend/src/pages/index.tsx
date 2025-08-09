import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import { fetchEmployees, fetchTrainings } from '../utils/api';


const Home: React.FC = () => {
  const [totalEmployees, setTotalEmployees] = useState<number | null>(null);
  const [ongoingTrainings, setOngoingTrainings] = useState<number | null>(null);

  useEffect(() => {
    const getTotalEmployees = async () => {
      try {
        const data = await fetchEmployees();
        setTotalEmployees(Array.isArray(data.employee) ? data.employee.length : 0);
      } catch (e) {
        setTotalEmployees(null);
      }
    };
    getTotalEmployees();
  }, []);

  useEffect(() => {
    const getOngoingTrainings = async () => {
      try {
        const data = await fetchTrainings();
        const now = new Date();
        const ongoing = Array.isArray(data.trainings)
          ? data.trainings.filter((t: any) => t.end_date && new Date(t.end_date) >= now).length
          : 0;
        setOngoingTrainings(ongoing);
      } catch (e) {
        setOngoingTrainings(null);
      }
    };
    getOngoingTrainings();
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
      {/* Cards Grid */}
      <div
        style={{
          marginTop: 100,
          padding: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 32,
          justifyItems: 'center',
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
            <div style={{ color: 'black', fontSize: 18, fontWeight: 700, textAlign: 'right' }}>56%</div>
            <div style={{ color: 'black', fontSize: 14, fontWeight: 400, alignSelf: 'center' }}>Average Training Progress</div>
            <div style={{ color: 'black', fontSize: 18, fontWeight: 700, textAlign: 'right' }}>8.9<span style={{ color: 'black', fontSize: 14, fontWeight: 400 }}>/10</span></div>
            <div style={{ color: 'black', fontSize: 14, fontWeight: 400, alignSelf: 'center' }}>Satisfaction Score</div>
          </div>
          <div style={{ marginTop: 'auto', alignSelf: 'center', width: 42, height: 42, borderRadius: 5, outline: '3px #3FD270 solid', outlineOffset: '-1.50px', marginBottom: 8 }} />
          <div style={{ alignSelf: 'center', width: 6, height: 12, transform: 'rotate(-135deg)', outline: '3px #3FD270 solid', outlineOffset: '-1.50px' }} />
        </div>
        {/* Training Insights Card */}
        <div style={{ width: 300, height: 400, background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, boxSizing: 'border-box' }}>
          <div style={{ color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, marginBottom: 16 }}>Training Insights</div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ color: 'black', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Top Performing Courses</div>
              <div style={{ color: 'black', fontSize: 14, fontWeight: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>Cybersecurity</span>
                <span>Time Management</span>
                <span>Presentation</span>
              </div>
            </div>
            <div>
              <div style={{ color: 'black', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Recommended Trainings</div>
              <div style={{ color: 'black', fontSize: 14, fontWeight: 400, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>Cybersecurity</span>
                <span>Time Management</span>
                <span>Presentation</span>
              </div>
            </div>
          </div>
        </div>
        {/* Upcoming Deadlines Card */}
        <div style={{ width: 300, height: 400, background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, boxSizing: 'border-box' }}>
          <div style={{ color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, marginBottom: 16 }}>Upcoming Deadlines</div>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ color: 'black', fontSize: 16, fontWeight: 700 }}>09/04 <span style={{ fontWeight: 400 }}>Presentation</span></div>
            <div style={{ color: 'black', fontSize: 16, fontWeight: 700 }}>12/04 <span style={{ fontWeight: 400 }}>Task 1</span></div>
            <div style={{ color: 'black', fontSize: 16, fontWeight: 700 }}>12/04 <span style={{ fontWeight: 400 }}>Task 1</span></div>
            <div style={{ color: 'black', fontSize: 16, fontWeight: 700 }}>12/04 <span style={{ fontWeight: 400 }}>Task 1</span></div>
          </div>
        </div>
        {/* Quick Actions Card */}
        <div style={{ width: 300, height: 400, background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 24, boxSizing: 'border-box' }}>
          <div style={{ color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <button style={{ width: '100%', height: 54, background: '#F5F5F5', borderRadius: 5, border: '1.5px #D9D9D9 solid', color: 'black', fontSize: 14, fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }}>Add New Employee</button>
            <button style={{ width: '100%', height: 54, background: '#F5F5F5', borderRadius: 5, border: '1.5px #D9D9D9 solid', color: 'black', fontSize: 14, fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }}>Assign Training</button>
            <button style={{ width: '100%', height: 54, background: '#F5F5F5', borderRadius: 5, border: '1.5px #D9D9D9 solid', color: 'black', fontSize: 14, fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }}>Generate Report</button>
            <button style={{ width: '100%', height: 54, background: '#F5F5F5', borderRadius: 5, border: '1.5px #D9D9D9 solid', color: 'black', fontSize: 14, fontWeight: 500, fontFamily: 'Montserrat', cursor: 'pointer' }}>Export Data</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;