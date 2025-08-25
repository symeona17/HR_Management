// Function to send feedback for a recommended skill
export async function sendSkillFeedback(employeeId: string | number, skillId: string | number, vote: 'up' | 'down') {
    const res = await fetch(`${API_BASE_URL}/employee/${employeeId}/skill-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_id: skillId, vote }),
    });
    if (!res.ok) throw new Error('Failed to send skill feedback');
    return await res.json();
}
// Search skills by label or alt_labels
export async function searchSkills(query: string) {
    const res = await fetch(`${API_BASE_URL}/skill/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search skills');
    return await res.json();
}
// Function to fetch recommended skills to train for an employee (ML endpoint)
export async function fetchRecommendedSkillsToTrain(employeeId: string | number) {
    const res = await fetch(`${API_BASE_URL}/employee/${employeeId}/suggested-skills`);
    if (!res.ok) throw new Error('Failed to fetch recommended skills to train');
    return await res.json();
}
// Get sentiment for a comment (without saving feedback)
export async function getSentimentForComment(comment: string) {
    const res = await fetch(`${API_BASE_URL}/feedback/sentiment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
    });
    if (!res.ok) throw new Error('Failed to get sentiment');
    return await res.json();
}
// Feedback API functions
export async function fetchEmployeeFeedback(employeeId: string | number) {
    const res = await fetch(`${API_BASE_URL}/feedback/${employeeId}`);
    if (!res.ok) throw new Error('Failed to fetch employee feedback');
    return await res.json();
}

export async function fetchAllFeedback() {
    const res = await fetch(`${API_BASE_URL}/feedback/`);
    if (!res.ok) throw new Error('Failed to fetch all feedback');
    return await res.json();
}

export async function submitFeedback(feedbackData: Record<string, any>) {
    const res = await fetch(`${API_BASE_URL}/feedback/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
    });
    if (!res.ok) throw new Error('Failed to submit feedback');
    return await res.json();
}
// Function to fetch a single employee by ID
export async function fetchEmployeeById(id: string | number) {
    const res = await fetch(`http://localhost:8000/employee/${id}`);
    if (!res.ok) throw new Error('Failed to fetch employee');
    return await res.json();
}
// Function to fetch all trainings
export async function fetchTrainings() {
    const res = await fetch('http://localhost:8000/training/');
    if (!res.ok) throw new Error('Failed to fetch trainings');
    return await res.json();
}


export const API_BASE_URL = 'http://localhost:8000'; // Adjust the base URL as needed

// Function to create a new training
export const createTraining = async (trainingData: Record<string, any>) => {
    const res = await fetch(`${API_BASE_URL}/training/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingData),
    });
    if (!res.ok) throw new Error('Failed to create training');
    return await res.json();
};

// Function to update an existing training
export const updateTraining = async (trainingId: string | number, trainingData: Record<string, any>) => {
    const res = await fetch(`${API_BASE_URL}/training/${trainingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingData),
    });
    if (!res.ok) throw new Error('Failed to update training');
    return await res.json();
};

// Function to delete a training
export const deleteTraining = async (trainingId: string | number) => {
    const res = await fetch(`${API_BASE_URL}/training/${trainingId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete training');
    return await res.json();
};

// Function for managers to request training for an employee
export const requestTraining = async (employeeId: string | number, trainingId: string | number, recommendationLevel: number = 3) => {
    const res = await fetch(`${API_BASE_URL}/training/need`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, recommended_training_id: trainingId, recommendation_level: recommendationLevel }),
    });
    if (!res.ok) throw new Error('Failed to request training');
    return await res.json();
};

// Function to fetch all skills
export async function fetchSkills(limit = 50) {
    const res = await fetch(`${API_BASE_URL}/skill/?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch skills');
    return await res.json();
}

// Function to create a new skill
export const createSkill = async (skillData: Record<string, any>) => {
    const res = await fetch(`${API_BASE_URL}/skill/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData),
    });
    if (!res.ok) throw new Error('Failed to create skill');
    return await res.json();
};

// Function to fetch all employees
export async function fetchEmployees() {
  const res = await fetch('http://localhost:8000/employee/');
  if (!res.ok) throw new Error('Failed to fetch');
  return await res.json();
}

// Function to create a new employee
export const createEmployee = async (employeeData: Record<string, any>) => {
    const res = await fetch(`${API_BASE_URL}/employee/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
    });
    if (!res.ok) throw new Error('Failed to create employee');
    return await res.json();
};

// Function to update an existing employee
export const updateEmployee = async (employeeId: string | number, employeeData: Record<string, any>) => {
    const res = await fetch(`${API_BASE_URL}/employee/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
    });
    if (!res.ok) throw new Error('Failed to update employee');
    return await res.json();
};

// Function to delete an employee
export const deleteEmployee = async (employeeId: string | number) => {
    const res = await fetch(`${API_BASE_URL}/employee/${employeeId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete employee');
    return await res.json();
};

// Function to search employees
export const searchEmployees = async (queryParams: Record<string, any>) => {
    const url = new URL(`${API_BASE_URL}/search-employee`);
    Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, value);
        }
    });
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to search employees');
    return await res.json();
};

// Function to trigger ML calculation of skills for an employee
export async function calculateMLSkills(employeeId: string | number, topn: number = 10) {
    const res = await fetch(`${API_BASE_URL}/employee/ml-calculate-skills/${employeeId}?topn=${topn}`, {
        method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to calculate ML skills');
    return await res.json();
}