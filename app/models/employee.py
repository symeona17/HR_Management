
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mysql.connector
from app.database import create_connection, fetch_results
from app.models.training import add_training, add_training_need, get_employee_training

router = APIRouter()

# Route to get a single employee by ID
@router.get("/{employee_id}")
def get_employee_by_id(employee_id: int):
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employee WHERE id = %s", (employee_id,))
    employee = cursor.fetchone()
    cursor.close()
    conn.close()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

# Pydantic model for Employee
class Employee(BaseModel):
    first_name: str
    last_name: str
    email: str
    hire_date: str
    department: str
    job_title: str
    details: str = ""

# Function to insert employee into the database
def insert_employee(employee: Employee):
    conn = create_connection()
    cursor = conn.cursor()
    query = """
    INSERT INTO employee (first_name, last_name, email, hire_date, department, job_title, details)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    values = (employee.first_name, employee.last_name, employee.email, employee.hire_date, employee.department, employee.job_title, employee.details)
    cursor.execute(query, values)
    conn.commit()
    cursor.close()
    conn.close()

# Route to create a new employees
@router.post("/")
def create_employee(employee: Employee):
    try:
        insert_employee(employee)
        return {"message": "Employee created successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

# Route to get all employees
@router.get("/")
def get_employee():
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employee")
    employee = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"employee": employee}

# Route to update an existing employees
@router.put("/{employee_id}")
def update_employee(employee_id: int, employee: Employee):
    conn = create_connection()
    cursor = conn.cursor()
    query = """
    UPDATE employee
    SET first_name = %s, last_name = %s, email = %s, hire_date = %s, department = %s, job_title = %s, details = %s
    WHERE id = %s
    """
    values = (employee.first_name, employee.last_name, employee.email, employee.hire_date, employee.department, employee.job_title, employee.details, employee_id)
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
    cursor.execute("DELETE FROM employee WHERE id = %s", (employee_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Employee deleted successfully"}


# Function to search employees by various attributes and return detailed data
def search_employee(name=None, surname=None, email=None, department=None):
    # Start building the query with a basic SELECT
    query = """
    SELECT e.id AS employee_id, e.first_name, e.last_name, e.email, e.hire_date, e.department, e.job_title,
           GROUP_CONCAT(DISTINCT CONCAT(t.title, ' (', t.category, ')') ORDER BY t.title) AS training,
           GROUP_CONCAT(DISTINCT CONCAT(feedback.feedback_date, ' - ', feedback.sentiment_score, ' - ', feedback.comments) ORDER BY feedback.feedback_date) AS feedback,
           GROUP_CONCAT(DISTINCT CONCAT(t2.title, ' (', tn.recommendation_level, '/5)') ORDER BY tn.recommended_training_id) AS training_need
    FROM employee e
    LEFT JOIN employee_training et ON e.id = et.employee_id
    LEFT JOIN training t ON et.training_id = t.id
    LEFT JOIN feedback ON e.id = feedback.employee_id
    LEFT JOIN training_need tn ON e.id = tn.employee_id
    LEFT JOIN training t2 ON tn.recommended_training_id = t2.id
    WHERE 1=1
    """
    values = []
    
    # Add conditions dynamically based on which fields are provided
    if name:
        query += " AND e.first_name LIKE %s"
        values.append(f"%{name}%")
    if surname:
        query += " AND e.last_name LIKE %s"
        values.append(f"%{surname}%")
    if email:
        query += " AND e.email LIKE %s"
        values.append(f"%{email}%")
    if department:
        query += " AND e.department LIKE %s"
        values.append(f"%{department}%")
    
    query += " GROUP BY e.id;"  # Ensure that we group by employee_id
    
    # Fetch results from the database
    results = fetch_results(query, tuple(values))
    
    # Return the list of employees directly, not wrapped in another 'employees' object
    return {"employee": results}
