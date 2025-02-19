from fastapi import FastAPI, Query
from app.models.employee import router as employee_router, search_employee
from app.models.skill import router as skills_router

app = FastAPI()

# Include the routers from employees and skills modules
app.include_router(employee_router, prefix="/employee", tags=["employee"])
app.include_router(skills_router, prefix="/skill", tags=["skill"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the HR Management API"}

@app.get("/search-employee")
def search_employee_endpoint(
    name: str = Query(None, max_length=100),
    surname: str = Query(None, max_length=100),
    email: str = Query(None, max_length=255),
    department: str = Query(None, max_length=100)
):
    try:
        # Search for employees based on query parameters
        results = search_employee(name, surname, email, department)
        if results:
            return {"employees": results}
        else:
            return {"message": "No employees found matching the criteria."}
    except Exception as e:
        return {"error": str(e)}