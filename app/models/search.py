from fastapi import APIRouter, Query, HTTPException
from app.models.employee import search_employee

router = APIRouter()

@router.get("/search-employee")
def search_employee_endpoint(
    name: str = Query(None, max_length=100),
    surname: str = Query(None, max_length=100),
    email: str = Query(None, max_length=255),
    department: str = Query(None, max_length=100),
    job_title: str = Query(None, max_length=100)
):
    try:
        results = search_employee(name, surname, email, department, job_title)
        if results:
            return {"employees": results}
        else:
            return {"message": "No employees found matching the criteria."}
    except Exception as e:
        return {"error": str(e)}
