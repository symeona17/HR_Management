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


const API_BASE_URL = 'http://localhost:8000'; // Adjust the base URL as needed

// Function to fetch all skills
export async function fetchSkills() {
    const res = await fetch(`${API_BASE_URL}/skill/`);
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