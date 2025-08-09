import React from 'react';
import NavBar from '../components/NavBar'; 


const Home: React.FC = () => {
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
      {/* Overview Card */}
      <div style={{ width: 300, height: 400, left: 49, top: 192, position: 'absolute' }}>
        <div style={{ width: 300, height: 400, left: 0, top: 0, position: 'absolute', background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid' }} />
        <div style={{ width: 52, height: 34, left: 25, top: 108, position: 'absolute', textAlign: 'right', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 18, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '36px', wordWrap: 'break-word' }}>64</div>
        <div style={{ width: 129, height: 22, left: 93, top: 114, position: 'absolute', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '28px', wordWrap: 'break-word' }}>Total Employees</div>
        <div style={{ width: 52, height: 34, left: 24, top: 158, position: 'absolute', textAlign: 'right', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 18, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '36px', wordWrap: 'break-word' }}>7</div>
        <div style={{ left: 92, top: 160.67, position: 'absolute', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '28px', wordWrap: 'break-word' }}>Ongoing Trainings</div>
        <div style={{ width: 52, height: 34, left: 24, top: 208, position: 'absolute', textAlign: 'right', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 18, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '36px', wordWrap: 'break-word' }}>56%</div>
        <div style={{ left: 92, top: 210.67, position: 'absolute', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '28px', wordWrap: 'break-word' }}>Average Training Progress</div>
        <div style={{ width: 52, height: 34, left: 24, top: 258, position: 'absolute', textAlign: 'right', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'black', fontSize: 18, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '36px', wordWrap: 'break-word' }}>8.9</span>
          <span style={{ color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '28px', wordWrap: 'break-word' }}>/10</span>
        </div>
        <div style={{ left: 92, top: 260.67, position: 'absolute', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '28px', wordWrap: 'break-word' }}>Satisfaction Score</div>
        <div style={{ left: 100, top: 33, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '40px', wordWrap: 'break-word' }}>Overview</div>
        <div style={{ width: 42, height: 42, left: 125, top: 318, position: 'absolute', borderRadius: 5, outline: '3px #3FD270 solid', outlineOffset: '-1.50px' }} />
        <div style={{ width: 5.94, height: 11.88, left: 144.95, top: 342.15, position: 'absolute', transform: 'rotate(-135deg)', transformOrigin: 'top left', outline: '3px #3FD270 solid', outlineOffset: '-1.50px' }} />
      </div>
      {/* Training Insights Card */}
      <div style={{ width: 300, height: 400, left: 396, top: 192, position: 'absolute' }}>
        <div style={{ width: 300, height: 400, left: 0, top: 0, position: 'absolute', background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid' }} />
        <div style={{ left: 62, top: 33, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '40px', wordWrap: 'break-word' }}>Training Insights</div>
        <div style={{ left: 48, top: 103, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '32px', wordWrap: 'break-word' }}>Top Performing Courses</div>
        <div style={{ left: 82, top: 135, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '28px', wordWrap: 'break-word' }}>Cybersecurity<br />Time Management<br />Presentation</div>
        <div style={{ left: 44, top: 219, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '32px', wordWrap: 'break-word' }}>Recommended Trainings</div>
        <div style={{ left: 78, top: 251, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '28px', wordWrap: 'break-word' }}>Cybersecurity<br />Time Management<br />Presentation</div>
      </div>
      {/* Upcoming Deadlines Card */}
      <div style={{ width: 300, height: 400, left: 743, top: 192, position: 'absolute' }}>
        <div style={{ width: 300, height: 400, left: 0, top: 0, position: 'absolute', background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid' }} />
        <div style={{ left: 40, top: 33, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '40px', wordWrap: 'break-word' }}>Upcoming Deadlines</div>
        <div style={{ left: 69, top: 100, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '32px', wordWrap: 'break-word' }}>09/04  </span>
          <span style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '32px', wordWrap: 'break-word' }}>Presentation<br /></span>
          <span style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '32px', wordWrap: 'break-word' }}>12/04</span>
          <span style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '32px', wordWrap: 'break-word' }}>  Task 1<br /></span>
          <span style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '32px', wordWrap: 'break-word' }}>12/04</span>
          <span style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '32px', wordWrap: 'break-word' }}>  Task 1<br /></span>
          <span style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '32px', wordWrap: 'break-word' }}>12/04</span>
          <span style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, lineHeight: '32px', wordWrap: 'break-word' }}>  Task 1<br /></span>
        </div>
      </div>
      {/* Quick Actions Card */}
      <div style={{ width: 300, height: 400, left: 1090, top: 192, position: 'absolute' }}>
        <div style={{ width: 300, height: 400, left: 0, top: 0, position: 'absolute', background: 'white', borderRadius: 15, border: '2px #D9D9D9 solid' }} />
        <div style={{ left: 77, top: 33, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 20, fontFamily: 'Montserrat', fontWeight: 700, lineHeight: '40px', wordWrap: 'break-word' }}>Quick Actions</div>
        <div style={{ width: 124, height: 54, left: 88, top: 85, position: 'absolute', background: '#F5F5F5', borderRadius: 5, border: '1.50px #D9D9D9 solid' }} />
        <div style={{ width: 87.53, height: 39.38, left: 107.45, top: 93.62, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 500, lineHeight: '21px', wordWrap: 'break-word' }}>Add New Employee</div>
        <div style={{ width: 124, height: 54, left: 88, top: 163, position: 'absolute', background: '#F5F5F5', borderRadius: 5, border: '1.50px #D9D9D9 solid' }} />
        <div style={{ width: 87.53, height: 39.38, left: 107.45, top: 171.62, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 500, lineHeight: '21px', wordWrap: 'break-word' }}>Assign Training</div>
        <div style={{ width: 124, height: 54, left: 89, top: 241, position: 'absolute', background: '#F5F5F5', borderRadius: 5, border: '1.50px #D9D9D9 solid' }} />
        <div style={{ width: 87.53, height: 39.38, left: 108.45, top: 249.62, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 500, lineHeight: '21px', wordWrap: 'break-word' }}>Generate Report</div>
        <div style={{ width: 124, height: 54, left: 88, top: 319, position: 'absolute', background: '#F5F5F5', borderRadius: 5, border: '1.50px #D9D9D9 solid' }} />
        <div style={{ width: 87.53, height: 39.38, left: 107.45, top: 327.62, position: 'absolute', textAlign: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', color: 'black', fontSize: 14, fontFamily: 'Montserrat', fontWeight: 500, lineHeight: '21px', wordWrap: 'break-word' }}>Export<br />Data</div>
      </div>
    </div>
  );
};

export default Home;