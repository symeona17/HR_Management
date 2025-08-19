import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NavBar from '../components/NavBar';
import { fetchTrainings, updateTraining, deleteTraining, getSentimentForComment, submitFeedback, fetchAllFeedback } from '../utils/api';


const TrainingDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [training, setTraining] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  // Feedback state
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackForm, setFeedbackForm] = useState({ feedback_date: '', comments: '', training_id: id });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<any>(null);

  // Fetch training details
  useEffect(() => {
    if (!id) return;
    fetchTrainings()
      .then(data => {
        const found = (data.trainings || []).find((t: any) => t.training_id === Number(id));
        setTraining(found || null);
        setForm(found || {});
        if (!found) setError('Training not found');
      })
      .catch(() => setError('Failed to fetch training details'));
  }, [id]);

  // Fetch feedback for this training
  useEffect(() => {
    if (!id) return;
    fetchAllFeedback()
      .then(data => {
        // Filter feedback for this training (by training_id)
        setFeedbackList(Array.isArray(data) ? data.filter((f: any) => f.training_id === Number(id)) : []);
      })
      .catch(() => setFeedbackList([]));
  }, [id]);

  useEffect(() => {
    setRole(localStorage.getItem('user_role') || '');
  }, []);

  if (error) return <div style={{ color: 'red', padding: 24 }}>{error}</div>;
  if (loading || !training) return <div>Loading...</div>;

  // Feedback form submit handler
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackLoading(true);
    try {
      // Get sentiment for the comment
      const sentimentResult = await getSentimentForComment(feedbackForm.comments);
      setPendingFeedback({
        date: feedbackForm.feedback_date,
        comments: feedbackForm.comments,
        sentiment_score: sentimentResult.sentiment_score,
        sentiment_label: sentimentResult.sentiment_label,
        sentiment_score_1_5: sentimentResult.sentiment_score_1_5,
      });
      setShowSentimentModal(true);
    } catch (err: any) {
      setFeedbackError('Failed to analyze sentiment.');
      setShowSentimentModal(false);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', minWidth: 320 }}>
      <NavBar />
      <div style={{ height: 120, background: '#F5F5F5' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, display: 'flex', gap: 40, flexWrap: 'wrap', background: 'white', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', position: 'relative' }}>
        {/* Edit button for hradmin */}
        {role === 'hradmin' && !editMode && (
          <button onClick={() => setEditMode(true)} style={{ position: 'absolute', top: 24, right: 24, background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer', zIndex: 2 }}>Edit</button>
        )}
        {/* Left: Training info */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 180, height: 180, background: '#D9D9D9', borderRadius: '50%', overflow: 'hidden', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="training" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
          </div>
          {editMode ? (
            <>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ fontSize: 24, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} />
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} placeholder="Category" />
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} style={{ fontSize: 14, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} placeholder="Start Date" />
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} style={{ fontSize: 14, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} placeholder="End Date" />
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center' }}>{training.title}</div>
              <div style={{ fontSize: 15, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 2 }}>{training.category}</div>
              <div style={{ fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, color: '#555', textAlign: 'center' }}>{new Date(training.start_date).toLocaleDateString()} - {new Date(training.end_date).toLocaleDateString()}</div>
              <div style={{ fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, color: (new Date(training.end_date) >= new Date()) ? '#3FD270' : '#D9534F', textAlign: 'center' }}>{(new Date(training.end_date) >= new Date()) ? 'Ongoing' : 'Finished'}</div>
            </>
          )}
        </div>
        {/* Right: Details and Feedback */}
        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 26, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>About this Training</div>
          {editMode ? (
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#333', lineHeight: '1.7', textAlign: 'justify', marginBottom: 16, borderRadius: 6, border: '1px solid #ccc', padding: 8, minHeight: 80 }} />
          ) : (
            <div style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#333', lineHeight: '1.7', textAlign: 'justify', marginBottom: 16 }}>{training.description}</div>
          )}
          {/* Feedback Section */}
          <div style={{ marginTop: 40 }}>
            <div style={{ fontSize: 20, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>Feedback</div>
            {/* Feedback Submission Form */}
            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, marginBottom: 24 }}>
              <label style={{ fontSize: 15 }}>Date:</label>
              <input type="date" value={feedbackForm.feedback_date} onChange={e => setFeedbackForm(f => ({ ...f, feedback_date: e.target.value }))} required style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              <label style={{ fontSize: 15 }}>Comments:</label>
              <textarea value={feedbackForm.comments} onChange={e => setFeedbackForm(f => ({ ...f, comments: e.target.value }))} required style={{ padding: 6, borderRadius: 4, border: '1px solid #ccc', minHeight: 60 }} />
              <button type="submit" disabled={feedbackLoading} style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer', marginTop: 8 }}>Submit Feedback</button>
              {feedbackError && <div style={{ color: 'red' }}>{feedbackError}</div>}
            </form>
            {/* Sentiment Confirmation Modal */}
            {showSentimentModal && pendingFeedback && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: 'white', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.15)', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Confirm Feedback Submission</div>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>
                    Sentiment: <b>{pendingFeedback.sentiment_label}</b> ({typeof pendingFeedback.sentiment_score === 'number' ? pendingFeedback.sentiment_score.toFixed(2) : 'N/A'})<br />
                    <span style={{ fontSize: 15 }}>
                      1-5 Score: <b>{pendingFeedback.sentiment_score_1_5 ?? 'N/A'}</b>
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                    (1 = Very Negative, 3 = Neutral, 5 = Very Positive)
                  </div>
                  <div style={{ fontSize: 15, marginBottom: 16, color: '#555' }}><b>Comment:</b> {pendingFeedback.comments}</div>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    <button
                      onClick={async () => {
                        setFeedbackLoading(true);
                        try {
                          await submitFeedback({
                            training_id: Number(id),
                            feedback_date: pendingFeedback.date,
                            comments: pendingFeedback.comments,
                            sentiment_score: pendingFeedback.sentiment_score,
                          });
                          setFeedbackForm({ feedback_date: '', comments: '', training_id: id });
                          // Refetch feedback
                          const data = await fetchAllFeedback();
                          setFeedbackList(Array.isArray(data) ? data.filter((f: any) => f.training_id === Number(id)) : []);
                          setShowSentimentModal(false);
                          setPendingFeedback(null);
                        } catch (err: any) {
                          setFeedbackError('Failed to submit feedback.');
                        } finally {
                          setFeedbackLoading(false);
                        }
                      }}
                      style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}
                      disabled={feedbackLoading}
                    >OK</button>
                    <button
                      onClick={() => {
                        setShowSentimentModal(false);
                        setPendingFeedback(null);
                      }}
                      style={{ background: '#888', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}
                      disabled={feedbackLoading}
                    >Cancel</button>
                  </div>
                </div>
              </div>
            )}
            {/* Feedback History */}
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 6 }}>Feedback History</div>
            {feedbackLoading ? <div>Loading feedback...</div> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {feedbackList.length === 0 && <li>No feedback yet.</li>}
                {feedbackList.map(fb => (
                  <li key={fb.id} style={{ background: '#f7f7f7', borderRadius: 8, marginBottom: 10, padding: 10 }}>
                    <div style={{ fontSize: 14, color: '#555' }}>{fb.feedback_date}</div>
                    <div style={{ fontSize: 15 }}>{fb.comments}</div>
                    {typeof fb.sentiment_score !== 'undefined' && fb.sentiment_score !== null && (
                      <div style={{ fontSize: 13, color: '#3FD270' }}>Sentiment: {fb.sentiment_score}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Edit/Save/Cancel/Delete buttons for hradmin */}
          {role === 'hradmin' && editMode && (
            <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
              <button onClick={async () => {
                setLoading(true);
                try {
                  await updateTraining(training.training_id, form);
                  setEditMode(false);
                  // Refetch updated data
                  fetchTrainings().then(data => {
                    const found = (data.trainings || []).find((t: any) => t.training_id === Number(id));
                    setTraining(found || null);
                    setForm(found || {});
                  });
                } catch (err: any) {
                  setError('Failed to update training: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }} style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Save</button>
              <button onClick={() => { setEditMode(false); setForm(training); }} style={{ background: '#888', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (!window.confirm('Are you sure you want to delete this training?')) return;
                setLoading(true);
                try {
                  await deleteTraining(training.training_id);
                  router.push('/trainings');
                } catch (err: any) {
                  setError('Failed to delete training: ' + err.message);
                } finally {
                  setLoading(false);
                }
              }} style={{ background: '#d32f2f', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 16, cursor: 'pointer' }}>Delete</button>
            </div>
          )}
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => router.back()}
              style={{ padding: '8px 24px', borderRadius: 8, background: '#eee', color: '#333', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetailsPage;
