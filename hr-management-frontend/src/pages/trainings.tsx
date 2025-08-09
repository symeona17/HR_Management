import React, { useEffect, useState, useMemo } from 'react';
import NavBar from '../components/NavBar';
import { fetchTrainings } from '../utils/api';

type Training = {
  training_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  category: string;
};

const TrainingsPage: React.FC = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [filtered, setFiltered] = useState<Training[]>([]);
  const [status, setStatus] = useState<'Ongoing' | 'Finished' | 'All'>('Ongoing');

  useEffect(() => {
    const getTrainings = async () => {
      try {
        const data = await fetchTrainings();
        setTrainings(Array.isArray(data.trainings) ? data.trainings : []);
      } catch {
        setTrainings([]);
      }
    };
    getTrainings();
  }, []);

  useEffect(() => {
    const now = new Date();
    let result = trainings;
    if (status === 'Ongoing') {
      result = trainings.filter(t => t.end_date && new Date(t.end_date) >= now);
    } else if (status === 'Finished') {
      result = trainings.filter(t => t.end_date && new Date(t.end_date) < now);
    }
    // Sort by start_date, newest first
    result = result.slice().sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    setFiltered(result);
  }, [status, trainings]);

  return (
    <div style={{ width: '100vw', minHeight: '100vh', minWidth: 320, position: 'relative', background: '#F5F5F5', overflow: 'auto' }}>
      <NavBar />
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
          Status
        </div>
        <select
          style={{ position: 'absolute', left: 31, top: 139, width: 181, height: 35, borderRadius: 10, border: '1px #D5D5D5 solid', background: '#F5F5F5', fontSize: 18, fontFamily: 'Montserrat', paddingLeft: 12 }}
          value={status}
          onChange={e => setStatus(e.target.value as 'Ongoing' | 'Finished' | 'All')}
        >
          <option value="Ongoing">Ongoing</option>
          <option value="Finished">Finished</option>
          <option value="All">All</option>
        </select>
      </div>
      {/* Trainings Cards Grid */}
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
        {filtered.map(training => (
          <div
            key={training.training_id}
            style={{
              width: 250,
              minHeight: 200,
              background: 'white',
              borderRadius: 15,
              border: '2px #D9D9D9 solid',
              position: 'relative',
              boxSizing: 'border-box',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ color: 'black', fontSize: 16, fontFamily: 'Montserrat', fontWeight: 600, marginBottom: 4 }}>{training.title}</div>
              <div style={{ color: '#717171', fontSize: 12, fontFamily: 'Montserrat', fontWeight: 400, marginBottom: 8 }}>{training.category}</div>
              <div style={{ color: 'black', fontSize: 12, fontFamily: 'Montserrat', fontWeight: 400, marginBottom: 8 }}>{training.description}</div>
            </div>
            <div style={{ color: '#3FD270', fontSize: 12, fontFamily: 'Montserrat', fontWeight: 500, marginBottom: 2 }}>
              {new Date(training.start_date).toLocaleDateString()} - {new Date(training.end_date).toLocaleDateString()}
            </div>
            <div style={{ color: (new Date(training.end_date) >= new Date()) ? '#3FD270' : '#D9534F', fontSize: 12, fontFamily: 'Montserrat', fontWeight: 600 }}>
              {(new Date(training.end_date) >= new Date()) ? 'Ongoing' : 'Finished'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrainingsPage;