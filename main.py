from fastapi import FastAPI, Query
from app.models.employees import router as employees_router, search_employees
from app.models.skills import router as skills_router

app = FastAPI()

# Include the routers from employees and skills modules
app.include_router(employees_router, prefix="/employees", tags=["employees"])
app.include_router(skills_router, prefix="/skills", tags=["skills"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the HR Management API"}

@app.get("/search-employees")
def search_employees_endpoint(
    name: str = Query(None, max_length=100),
    surname: str = Query(None, max_length=100),
    email: str = Query(None, max_length=255),
    department: str = Query(None, max_length=100)
):
    try:
        # Search for employees based on query parameters
        results = search_employees(name, surname, email, department)
        if results:
            return {"employees": results}
        else:
            return {"message": "No employees found matching the criteria."}
    except Exception as e:
        return {"error": str(e)}