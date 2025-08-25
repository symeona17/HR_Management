import NavBar from '../components/NavBar';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { fetchEmployeeById, updateEmployee, deleteEmployee, fetchEmployeeFeedback, submitFeedback, getSentimentForComment, fetchRecommendedSkillsToTrain, calculateMLSkills } from '../utils/api';

type Employee = {
  id?: number; // for backend compatibility
  employee_id?: number; // for frontend compatibility
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_title: string;
  hire_date: string;
  details: string;
  level?: string;
  trainings?: string[];
  skills?: { id: number; preferred_label: string; skill_type?: string; proficiency_level?: number }[];
  bio?: string;
};

const EmployeeDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const [calculating, setCalculating] = useState(false);
  // Feedback state
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [feedbackForm, setFeedbackForm] = useState({ feedback_date: '', comments: '' });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showSentimentModal, setShowSentimentModal] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState<{ date: string; comments: string; sentiment_score: number | null; sentiment_label: string | null; sentiment_score_1_5?: number | null } | null>(null);
  // Recommended skills to train state
  const [recommendedSkills, setRecommendedSkills] = useState<any[]>([]);
  const [recommendedCategories, setRecommendedCategories] = useState<any[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  // Fetch recommended skills to train for admin/manager
  useEffect(() => {
    if (!employee) return;
    if (role === 'hradmin' || role === 'manager') {
      const empId = employee.id ?? employee.employee_id;
      if (empId === undefined) {
        setRecommendedSkills([]);
        setRecommendedCategories([]);
        return;
      }
      setLoadingRec(true);
      fetchRecommendedSkillsToTrain(empId)
        .then(res => {
          setRecommendedSkills(res.suggested_skills || res.recommended_skills || []);
          setRecommendedCategories(res.recommended_categories || []);
        })
        .catch(() => {
          setRecommendedSkills([]);
          setRecommendedCategories([]);
        })
        .finally(() => setLoadingRec(false));
    } else {
      setRecommendedSkills([]);
      setRecommendedCategories([]);
    }
  }, [employee, role]);


  // Fetch feedback for employee
  useEffect(() => {
    const empId = employee?.id ?? employee?.employee_id;
    if (!empId) return;
    setFeedbackLoading(true);
    fetchEmployeeFeedback(empId)
      .then(data => setFeedbackList(data))
      .catch(() => setFeedbackList([]))
      .finally(() => setFeedbackLoading(false));
  }, [employee]);

  useEffect(() => {
    setRole(localStorage.getItem('user_role') || '');
  }, []);

  useEffect(() => {
    if (!id) return;
    const employeeId = Array.isArray(id) ? id[0] : id;
    if (!employeeId || employeeId === 'undefined') {
      setError('Invalid employee ID.');
      setEmployee(null);
      return;
    }
    setLoading(true);
    fetchEmployeeById(employeeId)
      .then(data => {
        setEmployee(data || null);
        setForm(data || {});
        setError(null);
      })
      .catch(err => {
        setError('Failed to fetch employee: ' + err.message);
        setEmployee(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return <div style={{ color: 'red', padding: 24 }}>{error}</div>;
  if (loading || !employee) return <div>Loading...</div>;

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
        {/* Left: Profile and basic info */}
        <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 180, height: 180, background: '#D9D9D9', borderRadius: '50%', overflow: 'hidden', marginBottom: 12 }}>
            <img src="/employee.png" alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {editMode ? (
            <>
              <input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} style={{ fontSize: 24, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} />
              <input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} style={{ fontSize: 24, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} placeholder="Email" />
              <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} />
              <input value={form.level || ''} onChange={e => setForm({ ...form, level: e.target.value })} style={{ fontSize: 14, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }} placeholder="Level" />
              <input
                type="date"
                value={form.hire_date}
                onChange={e => setForm({ ...form, hire_date: e.target.value })}
                style={{ fontSize: 14, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 4, borderRadius: 6, border: '1px solid #ccc', padding: 4, width: 180 }}
                placeholder="Hire Date"
              />
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, fontFamily: 'Montserrat', fontWeight: 600, color: '#222', textAlign: 'center' }}>{employee.first_name} {employee.last_name}</div>
              <div style={{ fontSize: 15, fontFamily: 'Montserrat', color: '#555', textAlign: 'center', marginBottom: 2 }}>{employee.email}</div>
              <div style={{ fontSize: 18, fontFamily: 'Montserrat', fontWeight: 400, color: '#555', textAlign: 'center' }}>{employee.department}</div>
              <div style={{ fontSize: 16, fontFamily: 'Montserrat', fontWeight: 400, color: '#555', textAlign: 'center' }}>{employee.level || 'Senior level'}<br />Joined {employee.hire_date}</div>
            </>
          )}
        </div>
        {/* Right: Details */}
        <div style={{ flex: 1, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 26, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>About {employee.first_name}</div>
          {editMode ? (
            <textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#333', lineHeight: '1.7', textAlign: 'justify', marginBottom: 16, borderRadius: 6, border: '1px solid #ccc', padding: 8, minHeight: 80 }} />
          ) : (
            <div style={{ fontSize: 16, fontFamily: 'Montserrat', color: '#333', lineHeight: '1.7', textAlign: 'justify', marginBottom: 16 }}>{employee.details}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 40 }}>
            {/* Trainings */}
            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: 20, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>Current Trainings</div>
              {(employee.trainings || []).length === 0
                ? <div>No ongoing trainings</div>
                : (employee.trainings || []).map((t, i) => (
                    <div key={i}>{t}</div>
                  ))
              }
              {/* Recommended Skills to Train for admin/manager */}
              {(role === 'hradmin' || role === 'manager') && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 17, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 6 }}>Recommended Skills to Train</div>
                    <button
                      onClick={async () => {
                        if (!employee) return;
                        setCalculating(true);
                        try {
                          const empId = employee.id ?? employee.employee_id;
                          if (empId === undefined) return;
                          await calculateMLSkills(empId);
                          // Refetch recommended skills after calculation
                          setLoadingRec(true);
                          const res = await fetchRecommendedSkillsToTrain(empId);
                          setRecommendedSkills(res.suggested_skills || res.recommended_skills || []);
                          setRecommendedCategories(res.recommended_categories || []);
                        } catch (err) {
                          // Optionally show error
                        } finally {
                          setCalculating(false);
                          setLoadingRec(false);
                        }
                      }}
                      disabled={calculating}
                      style={{ marginLeft: 8, padding: '4px 14px', borderRadius: 6, border: '1px solid #1976d2', background: calculating ? '#e3eaf7' : 'white', color: '#1976d2', fontWeight: 500, fontSize: 15, cursor: calculating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {calculating ? (
                        <span className="spinner" style={{ width: 16, height: 16, border: '2px solid #1976d2', borderTop: '2px solid transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                      ) : 'Calculate'}
                    </button>
                  </div>
                  {loadingRec ? 'Loading...' :
                    (recommendedSkills.length === 0 ? 'No recommendations' : (
                      <ul style={{margin: 0}}>
                        {recommendedSkills.map((t: any) => (
                          <li key={t.skill_id}>
                            {t.skill_name}
                            <span style={{color:'#888', fontSize:13}}> ({t.category})</span>
                            <span style={{color:'#1976d2', fontSize:13, marginLeft:8}}>Score: {t.score}</span>
                          </li>
                        ))}
                      </ul>
                    ))}
                </div>
              )}
            </div>
            {/* Skills */}
            <div style={{ minWidth: 220 }}>
              <div style={{ fontSize: 20, fontFamily: 'Montserrat', fontWeight: 500, color: '#222', marginBottom: 8 }}>Skills</div>
              <ul style={{ fontSize: 15, fontFamily: 'Montserrat', color: '#333', margin: 0 }}>
                {(employee.skills || []).length === 0 && <li>No skills listed</li>}
                {(employee.skills || [])
                  .filter(skill => {
                    if (!skill || !skill.preferred_label) return false;
                    const label = skill.preferred_label.trim().toLowerCase();
                    return label !== '' && label !== '(-)';
                  })
                  .slice()
                  .sort((a, b) => (b.proficiency_level || 0) - (a.proficiency_level || 0))
                  .map(skill => (
                    <li key={skill.id}>
                      {skill.preferred_label}
                      {typeof skill.proficiency_level !== 'undefined' && (
                        <span style={{ color: '#3FD270', fontSize: 13, marginLeft: 8 }}>Proficiency: {skill.proficiency_level}</span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          </div>
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
                          const empId = employee?.id ?? employee?.employee_id;
                          if (!empId) throw new Error('Employee ID missing');
                          await submitFeedback({
                            employee_id: empId,
                            feedback_date: pendingFeedback.date,
                            comments: pendingFeedback.comments,
                            sentiment_score: pendingFeedback.sentiment_score,
                          });
                          setFeedbackForm({ feedback_date: '', comments: '' });
                          // Refetch feedback
                          const data = await fetchEmployeeFeedback(empId);
                          setFeedbackList(data);
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
                  const empId = employee.id ?? employee.employee_id;
                  // ...rest of the save logic...
                } catch (err) {
                  // ...error handling...
                } finally {
                  setLoading(false);
                }
              }}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
              <button onClick={async () => {
                setLoading(true);
                try {
                  const empId = employee.id ?? employee.employee_id;
                  if (empId === undefined) {
                    setError('Employee ID is missing.');
                    return;
                  }
                  await deleteEmployee(empId);
                  router.push('/employees');
                } catch (err) {
                  setError('Failed to delete employee.');
                } finally {
                  setLoading(false);
                }
              }} style={{ background: '#e53935', color: 'white' }}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsPage;
