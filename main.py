
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.employee import router as employee_router
from app.models.skill import router as skills_router
from app.models.auth import router as auth_router
from app.models.training import router as training_router
from app.models.search import router as search_router
from app.models.feedback import router as feedback_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employee_router, prefix="/employee", tags=["employee"])
app.include_router(skills_router, prefix="/skill", tags=["skill"])
app.include_router(auth_router, tags=["auth"])
app.include_router(training_router, tags=["training"])
app.include_router(search_router, tags=["search"])

app.include_router(feedback_router, prefix="/feedback", tags=["feedback"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the HR Management API"}