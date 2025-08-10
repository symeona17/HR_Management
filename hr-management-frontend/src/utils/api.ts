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
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Adjust the base URL as needed

// Function to fetch all employees
export async function fetchEmployees() {
  const res = await fetch('http://localhost:8000/employee/');
  if (!res.ok) throw new Error('Failed to fetch');
  return await res.json();
}

// Function to create a new employee
export const createEmployee = async (employeeData: Record<string, any>) => {
    const response = await axios.post(`${API_BASE_URL}/employee/`, employeeData);
    return response.data;
};

// Function to update an existing employee
export const updateEmployee = async (employeeId: string | number, employeeData: Record<string, any>) => {
    const response = await axios.put(`${API_BASE_URL}/employee/${employeeId}`, employeeData);
    return response.data;
};

// Function to delete an employee
export const deleteEmployee = async (employeeId: string | number) => {
    const response = await axios.delete(`${API_BASE_URL}/employee/${employeeId}`);
    return response.data;
};

// Function to search employees
export const searchEmployees = async (queryParams: Record<string, any>) => {
    const response = await axios.get(`${API_BASE_URL}/search-employee`, { params: queryParams });
    return response.data;
};