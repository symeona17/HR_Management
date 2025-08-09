import React from 'react';
import NavBar from '../components/NavBar';

const TrainingsPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', position: 'relative' }}>
      <NavBar />
      <div style={{ paddingTop: 120 }}>
        <h1>Trainings</h1>
        <p>This is the Trainings page. You can list, add, or manage trainings here.</p>
      </div>
    </div>
  );
};

export default TrainingsPage;