from fastapi import FastAPI
from pydantic import BaseModel
from database import fetch_results, execute_query

app = FastAPI()

# Pydantic model for Employee data validation
class Employee(BaseModel):
    first_name: str
    last_name: str
    email: str
    hire_date: str
    department: str
    job_title: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the application"}

@app.get("/employees")
def get_employees():
    query = "SELECT * FROM employees"
    results = []
    try:
        results = fetch_results(query)
    except Exception as e:
        return {"error": str(e)}
    return {"employees": results}

# Create new employee
@app.post("/employees")
def create_employee(employee: Employee):
    query = """
    INSERT INTO employees (first_name, last_name, email, hire_date, department, job_title)
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    try:
        employee_id = execute_query(query, (
            employee.first_name,
            employee.last_name,
            employee.email,
            employee.hire_date,
            employee.department,
            employee.job_title
        ))
        return {"message": "Employee created successfully!", "id": employee_id}
    except Exception as e:
        return {"error": f"Error inserting employee: {str(e)}"}

# Update existing employee
@app.put("/employees/{employee_id}")
def update_employee(employee_id: int, employee: Employee):
    query = """
    UPDATE employees
    SET first_name = %s, last_name = %s, email = %s, hire_date = %s, department = %s, job_title = %s
    WHERE id = %s
    """
    try:
        execute_query(query, (
            employee.first_name,
            employee.last_name,
            employee.email,
            employee.hire_date,
            employee.department,
            employee.job_title,
            employee_id
        ))
        return {"message": "Employee updated successfully!"}
    except Exception as e:
        return {"error": f"Error updating employee: {str(e)}"}

# Delete an employee
@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: int):
    query = "DELETE FROM employees WHERE id = %s"
    try:
        execute_query(query, (employee_id,))
        return {"message": "Employee deleted successfully!"}
    except Exception as e:
        return {"error": f"Error deleting employee: {str(e)}"}
