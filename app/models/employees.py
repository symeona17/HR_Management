# app/employees.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mysql.connector
from app.database import create_connection

router = APIRouter()

# Pydantic model for Employee
class Employee(BaseModel):
    first_name: str
    last_name: str
    email: str
    hire_date: str
    department: str
    job_title: str

# Function to insert employee into the database
def insert_employee(employee: Employee):
    conn = create_connection()
    cursor = conn.cursor()
    query = """
    INSERT INTO employees (first_name, last_name, email, hire_date, department, job_title)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    values = (employee.first_name, employee.last_name, employee.email, employee.hire_date, employee.department, employee.job_title)
    cursor.execute(query, values)
    conn.commit()
    cursor.close()
    conn.close()

# Route to create a new employee
@router.post("/")
def create_employee(employee: Employee):
    try:
        insert_employee(employee)
        return {"message": "Employee created successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

# Route to get all employees
@router.get("/")
def get_employees():
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employees")
    employees = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"employees": employees}

# Route to update an existing employee
@router.put("/{employee_id}")
def update_employee(employee_id: int, employee: Employee):
    conn = create_connection()
    cursor = conn.cursor()
    query = """
    UPDATE employees
    SET first_name = %s, last_name = %s, email = %s, hire_date = %s, department = %s, job_title = %s
    WHERE id = %s
    """
    values = (employee.first_name, employee.last_name, employee.email, employee.hire_date, employee.department, employee.job_title, employee_id)
    cursor.execute(query, values)
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Employee updated successfully"}

# Route to delete an employee
@router.delete("/{employee_id}")
def delete_employee(employee_id: int):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM employees WHERE id = %s", (employee_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Employee deleted successfully"}
