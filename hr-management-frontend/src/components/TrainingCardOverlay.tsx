import React from 'react';

interface TrainingCardOverlayProps {
  open: boolean;
  onClose: () => void;
  training: any | null;
  onDetails: (trainingId: number) => void;
}

const TrainingCardOverlay: React.FC<TrainingCardOverlayProps> = ({ open, onClose, training, onDetails }) => {
  if (!open || !training) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.25)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
        padding: 32,
        minWidth: 340,
        maxWidth: 420,
        position: 'relative',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        <h2 style={{ marginBottom: 12 }}>{training.title}</h2>
        <div style={{ color: '#888', marginBottom: 8 }}>{training.category}</div>
        <div style={{ marginBottom: 12 }}>{training.description}</div>
        <div style={{ color: '#3FD270', fontWeight: 600, marginBottom: 8 }}>
          {new Date(training.start_date).toLocaleDateString()} - {new Date(training.end_date).toLocaleDateString()}
        </div>
        <div style={{ color: (new Date(training.end_date) >= new Date()) ? '#3FD270' : '#D9534F', fontWeight: 600, marginBottom: 16 }}>
          {(new Date(training.end_date) >= new Date()) ? 'Ongoing' : 'Finished'}
        </div>
        <button
          onClick={() => onDetails(training.training_id)}
          style={{ padding: '8px 24px', borderRadius: 8, background: '#3FD270', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
        >
          Details
        </button>
      </div>
    </div>
  );
};

export default TrainingCardOverlay;
