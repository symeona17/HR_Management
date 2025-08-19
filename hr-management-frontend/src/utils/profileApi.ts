// Utility functions for trainer and manager profile data
import { API_BASE_URL } from './api';

export async function fetchTrainerTrainings(trainerId: number) {
  const res = await fetch(`${API_BASE_URL}/trainer/${trainerId}/trainings`);
  return res.json();
}

export async function fetchTrainerFeedback(trainerId: number) {
  const res = await fetch(`${API_BASE_URL}/trainer/${trainerId}/feedback`);
  return res.json();
}

export async function fetchManagerTeam(managerId: number) {
  const res = await fetch(`${API_BASE_URL}/manager/${managerId}/team`);
  return res.json();
}

export async function fetchManagerAnalytics(managerId: number) {
  const res = await fetch(`${API_BASE_URL}/manager/${managerId}/team-analytics`);
  return res.json();
}

export async function managerAssignTraining(employeeId: number, trainingId: number) {
  const res = await fetch(`${API_BASE_URL}/manager/assign-training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_id: employeeId, training_id: trainingId })
  });
  return res.json();
}
