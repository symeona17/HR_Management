
from fastapi import FastAPI, Depends
from fastapi.responses import FileResponse
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging


from app.models.employee import router as employee_router
from app.models.skill import router as skills_router
from app.models.auth import router as auth_router, get_current_user
from app.models.training import router as training_router
from app.models.manager import router as manager_router
from app.models.search import router as search_router
from app.models.feedback import router as feedback_router

from app.models.analytics import router as analytics_router
from app.models.recommendation import router as recommendation_router

app = FastAPI()

FRONTEND_ORIGINS = [
    "http://localhost:3000",
]
try:
    # allow setting production frontend origin via env
    import os
    prod_origin = os.getenv("FRONTEND_ORIGIN")
    if prod_origin:
        FRONTEND_ORIGINS.append(prod_origin)
except Exception:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

protected = [Depends(get_current_user)]

# --- Daily ML Retrain Scheduler ---
scheduler = BackgroundScheduler()

def scheduled_retrain_job():
    """Background job to retrain ML model and populate skill_need daily."""
    try:
        from app.ml_feedback_training import retrain_recommender_on_feedback
        logging.info("[Scheduler] Starting daily ML retrain job...")
        retrain_recommender_on_feedback(employee_id=None, topn=5)
        logging.info("[Scheduler] Daily ML retrain job completed successfully.")
    except Exception as e:
        logging.error(f"[Scheduler] Daily ML retrain job failed: {e}")

# Schedule daily retrain at 2:00 AM
scheduler.add_job(scheduled_retrain_job, CronTrigger(hour=2, minute=0))

@app.on_event("startup")
def start_scheduler():
    """Start the background scheduler when app starts."""
    scheduler.start()
    logging.info("Scheduler started. Daily retrain job scheduled for 2:00 AM UTC.")

@app.on_event("shutdown")
def shutdown_scheduler():
    """Shutdown the scheduler when app stops."""
    scheduler.shutdown()
    logging.info("Scheduler shutdown.")

app.include_router(employee_router, prefix="/employee", tags=["employee"], dependencies=protected)
app.include_router(skills_router, prefix="/skill", tags=["skill"], dependencies=protected)
app.include_router(auth_router, tags=["auth"])  # keep auth routes public
app.include_router(training_router, tags=["training"], dependencies=protected)
app.include_router(manager_router, prefix="/manager", tags=["manager"], dependencies=protected)
app.include_router(search_router, tags=["search"], dependencies=protected)

app.include_router(feedback_router, prefix="/feedback", tags=["feedback"], dependencies=protected)

app.include_router(analytics_router, prefix="/analytics", tags=["analytics"], dependencies=protected)

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