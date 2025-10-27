
from fastapi import FastAPI
from fastapi.responses import FileResponse
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware


from app.models.employee import router as employee_router
from app.models.skill import router as skills_router
from app.models.auth import router as auth_router
from app.models.training import router as training_router
from app.models.manager import router as manager_router
from app.models.search import router as search_router
from app.models.feedback import router as feedback_router

from app.models.analytics import router as analytics_router
from app.models.recommendation import router as recommendation_router

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
app.include_router(manager_router, prefix="/manager", tags=["manager"])
app.include_router(search_router, tags=["search"])

app.include_router(feedback_router, prefix="/feedback", tags=["feedback"])

app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])

#app.include_router(recommendation_router, prefix="/recommendation", tags=["recommendation"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the HR Management API"}


# Serve favicon requests so browsers don't generate 404s in server logs
@app.get("/favicon.ico")
def favicon():
    # Look for the frontend favicon in the hr-management-frontend/public folder
    candidate = Path(__file__).resolve().parent / "hr-management-frontend" / "public" / "favicon.ico"
    if candidate.exists():
        return FileResponse(str(candidate))
    # fallback: return 204 No Content to avoid a 404
    return FileResponse(str(candidate))