import React, { useEffect, useState } from 'react';
import NavBar from '../components/NavBar';
import { API_BASE_URL } from '../utils/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type MonthlyPoint = { month: string; avg_feedback: number; n: number };

const AnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);
  const [managerId, setManagerId] = useState<string | null>(null);

  const loadData = async (opts: { start?: string | null; end?: string | null; dept?: string | null; manager?: string | null } = {}) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (opts.start) qs.append('start_date', opts.start);
      if (opts.end) qs.append('end_date', opts.end);
      if (opts.dept) qs.append('department', opts.dept);
      if (opts.manager) qs.append('manager_id', opts.manager);

      const base = `${API_BASE_URL}/analytics`;
      const oRes = await fetch(`${base}/overview?${qs.toString()}`);
      const oJson = await oRes.json();
      setOverview(oJson);

      const tRes = await fetch(`${base}/trainings?${qs.toString()}`);
      const tJson = await tRes.json();
      setTrainings(tJson.trainings || []);

      const fRes = await fetch(`${base}/feedback?${qs.toString()}`);
      const fJson = await fRes.json();
      setFeedback(fJson);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async (format: 'csv' | 'excel' = 'csv') => {
    const qs = new URLSearchParams();
    if (startDate) qs.append('start_date', startDate);
    if (endDate) qs.append('end_date', endDate);
    if (department) qs.append('department', department);
    if (managerId) qs.append('manager_id', managerId);
    const url = `${API_BASE_URL}/analytics/export?format=${format}${qs.toString() ? `&${qs.toString()}` : ''}`;
    try {
      // Fetch the file as a blob
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();

      // Try to extract filename from Content-Disposition header
      let filename = 'analytics_export.' + (format === 'excel' ? 'xlsx' : 'csv');
      const cd = res.headers.get('Content-Disposition') || res.headers.get('content-disposition');
      if (cd) {
        const match = cd.match(/filename\*=UTF-8''(.+)$|filename="?([^;"']+)"?/i);
        if (match) {
          filename = decodeURIComponent((match[1] || match[2] || filename));
        }
      }

      // If the browser supports the File System Access API, ask user where to save
      const anyWindow: any = window as any;
      if (anyWindow.showSaveFilePicker) {
        try {
          const opts: any = {
            suggestedName: filename,
          };
          if (format === 'csv') {
            opts.types = [{ description: 'CSV', accept: { 'text/csv': ['.csv'] } }];
          } else {
            opts.types = [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }];
          }
          const handle = await anyWindow.showSaveFilePicker(opts);
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          // done
          return;
        } catch (err: any) {
          const name = err?.name || '';
          const message = String(err?.message || err || '');
          if (name === 'AbortError' || name === 'NotAllowedError' || /cancel/i.test(message)) {
            console.info('User cancelled save file picker - aborting export');
            return;
          }
          console.warn('Save file picker failed, falling back to download', err);
        }
      }

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. See console for details.');
    }
  };

  const monthly: MonthlyPoint[] = overview?.monthly_feedback || overview?.monthly || [];
  const labels = monthly.map((m) => m.month);
  const dataValues = monthly.map((m) => Number(m.avg_feedback || 0));

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', minWidth: 320 }}>
      <NavBar />
      <div style={{ height: 120, background: '#F5F5F5' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, background: 'white', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minHeight: 600 }}>
        <h1 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: 32, marginBottom: 24 }}>Analytics & Reports</h1>

        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ background: '#f7f7f7', padding: 18, borderRadius: 12, minWidth: 220 }}>
            <div style={{ fontSize: 12, color: '#888' }}>Employees</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{overview ? overview.employee_count : '—'}</div>
          </div>
          <div style={{ background: '#f7f7f7', padding: 18, borderRadius: 12, minWidth: 220 }}>
            <div style={{ fontSize: 12, color: '#888' }}>Trainings</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{overview ? overview.training_count : '—'}</div>
          </div>
          <div style={{ background: '#f7f7f7', padding: 18, borderRadius: 12, minWidth: 220 }}>
            <div style={{ fontSize: 12, color: '#888' }}>Feedback (avg)</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{overview ? (overview.avg_feedback !== null ? overview.avg_feedback.toFixed(2) : 'N/A') : '—'}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => handleExport('csv')} style={{ background: '#3FD270', color: 'white', border: 'none', borderRadius: 6, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>Export CSV</button>
            <button onClick={() => handleExport('excel')} style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}>Export Excel</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 320, background: '#f7f7f7', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Employee Feedback (monthly)</h2>
            {loading ? <div>Loading…</div> : (
              <div>
                <div style={{ width: '100%', maxWidth: 640, marginBottom: 12 }}>
                  <Line
                    data={{
                      labels,
                      datasets: [
                        {
                          label: 'Avg feedback',
                          data: dataValues,
                          borderColor: '#1976d2',
                          backgroundColor: 'rgba(25,118,210,0.08)',
                          tension: 0.3,
                        },
                      ],
                    }}
                    options={{
                      plugins: { legend: { display: false } },
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                    height={160}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {monthly.map((m: MonthlyPoint) => (
                    <div key={m.month} style={{ background: 'white', padding: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', minWidth: 96 }}>
                      <div style={{ fontSize: 12, color: '#888' }}>{m.month}</div>
                      <div style={{ fontWeight: 700 }}>{m.avg_feedback !== null ? Number(m.avg_feedback).toFixed(2) : 'N/A'}</div>
                      <div style={{ fontSize: 12, color: '#aaa' }}>{m.n} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 520px', minWidth: 320, background: '#f7f7f7', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Trainings by participants</h2>
            <div style={{ maxHeight: 320, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '8px 12px' }}>Title</th>
                    <th style={{ padding: '8px 12px' }}>Category</th>
                    <th style={{ padding: '8px 12px', width: 120 }}>Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #fafafa' }}>
                      <td style={{ padding: '8px 12px' }}>{t.title}</td>
                      <td style={{ padding: '8px 12px' }}>{t.category}</td>
                      <td style={{ padding: '8px 12px' }}>{t.participants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24, background: '#f7f7f7', padding: 18, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0 }}>Feedback: Top / Bottom</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: 260 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Top Positive (avg)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {feedback?.top_positive?.map((p: any) => (
                    <tr key={p.employee_id} style={{ borderBottom: '1px solid #fff' }}>
                      <td style={{ padding: 8 }}>{p.first_name} {p.last_name}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{Number(p.avg_feedback).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ flex: '1 1 320px', minWidth: 260 }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Top Negative (avg)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {feedback?.top_negative?.map((p: any) => (
                    <tr key={p.employee_id} style={{ borderBottom: '1px solid #fff' }}>
                      <td style={{ padding: 8 }}>{p.first_name} {p.last_name}</td>
                      <td style={{ padding: 8, textAlign: 'right' }}>{Number(p.avg_feedback).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
