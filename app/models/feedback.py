
"""
Feedback endpoints and models for the HR Management system.
Handles feedback CRUD and sentiment analysis using VADER.
"""

from fastapi import APIRouter, HTTPException, Body, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.database.database import execute_query, fetch_results
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

router = APIRouter()


class FeedbackCreate(BaseModel):
    """Request model for creating feedback."""
    employee_id: int
    feedback_date: date
    sentiment_score: Optional[float] = None
    comments: Optional[str] = None


class FeedbackOut(BaseModel):
    """Response model for feedback records."""
    id: int
    employee_id: int
    feedback_date: date
    sentiment_score: Optional[float]
    comments: Optional[str]


@router.post("/", response_model=None)
def create_feedback(feedback: FeedbackCreate):
    """Create a new feedback record. Calculates sentiment if comments are provided."""
    sentiment = None
    if feedback.comments:
        analyzer = SentimentIntensityAnalyzer()
        # VADER returns a compound score between -1 and 1
        sentiment = float(analyzer.polarity_scores(feedback.comments)['compound'])
    query = """
        INSERT INTO feedback (employee_id, feedback_date, sentiment_score, comments)
        VALUES (%s, %s, %s, %s)
    """
    values = (feedback.employee_id, feedback.feedback_date, sentiment, feedback.comments)
    execute_query(query, values)
    return {"message": "Feedback submitted successfully."}


@router.get("/{employee_id}", response_model=List[FeedbackOut])
def get_feedback_for_employee(employee_id: int):
    """Get all feedback for a specific employee, most recent first."""
    query = "SELECT * FROM feedback WHERE employee_id = %s ORDER BY feedback_date DESC"
    results = fetch_results(query, (employee_id,))
    return [FeedbackOut(**dict(row)) for row in results]


@router.get("/", response_model=List[FeedbackOut])
def get_all_feedback():
    """Get all feedback records, most recent first."""
    query = "SELECT * FROM feedback ORDER BY feedback_date DESC"
    results = fetch_results(query)
    return [FeedbackOut(**dict(row)) for row in results]


# Cleaned up: Only one set of imports, router, models, endpoints, and /sentiment endpoint
from fastapi import APIRouter, HTTPException, Body, Request
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from app.database.database import execute_query, fetch_results
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

router = APIRouter()

class FeedbackCreate(BaseModel):
    employee_id: int
    feedback_date: date
    sentiment_score: Optional[float] = None
    comments: Optional[str] = None

class FeedbackOut(BaseModel):
    id: int
    employee_id: int
    feedback_date: date
    sentiment_score: Optional[float]
    comments: Optional[str]

@router.post("/", response_model=None)
def create_feedback(feedback: FeedbackCreate):
    # Calculate sentiment using VADER
    sentiment = None
    if feedback.comments:
        analyzer = SentimentIntensityAnalyzer()
        sentiment = float(analyzer.polarity_scores(feedback.comments)['compound'])  # -1 to 1
    query = """
        INSERT INTO feedback (employee_id, feedback_date, sentiment_score, comments)
        VALUES (%s, %s, %s, %s)
    """
    values = (feedback.employee_id, feedback.feedback_date, sentiment, feedback.comments)
    execute_query(query, values)
    return {"message": "Feedback submitted successfully."}

@router.get("/{employee_id}", response_model=List[FeedbackOut])
def get_feedback_for_employee(employee_id: int):
    query = "SELECT * FROM feedback WHERE employee_id = %s ORDER BY feedback_date DESC"
    results = fetch_results(query, (employee_id,))
    return [FeedbackOut(**dict(row)) for row in results]

@router.get("/", response_model=List[FeedbackOut])
def get_all_feedback():
    query = "SELECT * FROM feedback ORDER BY feedback_date DESC"
    results = fetch_results(query)
    return [FeedbackOut(**dict(row)) for row in results]


@router.post("/sentiment")
async def get_sentiment(request: Request):
    """Analyze the sentiment of a comment and return the score and label."""
    data = await request.json()
    comment = data.get("comment", "")
    if not comment:
        raise HTTPException(status_code=400, detail="Comment is required.")
    analyzer = SentimentIntensityAnalyzer()
    sentiment = analyzer.polarity_scores(comment)
    compound = sentiment.get('compound', 0.0)
    # Convert compound (-1 to 1) to 1-5 scale
    sentiment_score_1_5 = round(((compound + 1) * 2) + 1)
    sentiment_score_1_5 = max(1, min(5, sentiment_score_1_5))  # Clamp to 1-5
    # Assign a label based on the compound score
    if compound >= 0.05:
        label = "Positive"
    elif compound <= -0.05:
        label = "Negative"
    else:
        label = "Neutral"
    return {
        "sentiment_score": compound,
        "sentiment_label": label,
        "sentiment_score_1_5": sentiment_score_1_5
    }
