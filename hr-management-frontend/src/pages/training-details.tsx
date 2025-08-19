import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import { fetchTrainings } from '../utils/api';

const TrainingDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [training, setTraining] = useState<any | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    // Fetch all trainings and find the one with the matching id
    fetchTrainings()
      .then(data => {
        const found = (data.trainings || []).find((t: any) => t.training_id === Number(id));
        setTraining(found || null);
        if (!found) setError('Training not found');
      })
      .catch(() => setError('Failed to fetch training details'));
  }, [id]);

  if (error) {
    return (
      <div>
        <NavBar />
        <div style={{ marginTop: 120, textAlign: 'center', color: 'red', fontSize: 20 }}>{error}</div>
      </div>
    );
  }
  if (!training) {
    return (
      <div>
        <NavBar />
        <div style={{ marginTop: 120, textAlign: 'center', color: '#888', fontSize: 18 }}>Loading...</div>
      </div>
    );
  }
  return (
    <div>
      <NavBar />
      <div style={{ maxWidth: 600, margin: '100px auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #eee' }}>
        <h2>{training.title}</h2>
        <div style={{ color: '#888', marginBottom: 8 }}>{training.category}</div>
        <div style={{ marginBottom: 16 }}>{training.description}</div>
        <div style={{ color: '#3FD270', fontWeight: 600, marginBottom: 8 }}>
          {new Date(training.start_date).toLocaleDateString()} - {new Date(training.end_date).toLocaleDateString()}
        </div>
        <div style={{ color: (new Date(training.end_date) >= new Date()) ? '#3FD270' : '#D9534F', fontWeight: 600, marginBottom: 16 }}>
          {(new Date(training.end_date) >= new Date()) ? 'Ongoing' : 'Finished'}
        </div>
        {/* Add more details here as needed */}
      </div>
    </div>
  );
};

export default TrainingDetailsPage;
