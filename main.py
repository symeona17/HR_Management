from fastapi import FastAPI
from app.models.employees import router as employees_router
from app.models.skills import router as skills_router

app = FastAPI()

# Include the routers from employees and skills modules
app.include_router(employees_router, prefix="/employees", tags=["employees"])
app.include_router(skills_router, prefix="/skills", tags=["skills"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the HR Management API"}