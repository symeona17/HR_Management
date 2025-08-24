"""
FastAPI endpoint for hybrid L&D recommendations using the pure Python recommender.
"""
# Allow running as script or module
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) )
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.ml_recommender import HybridRecommender, get_employees, get_trainings, get_employee_skills, get_training_history, get_training_need
from app.database import create_connection

router = APIRouter()


# Pydantic model for OpenAPI docs
class TrainingRecommendation(BaseModel):
    id: int
    title: str
    category: Optional[str]
    description: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    recommendation_score: float

class RecommendationResponse(BaseModel):
    recommended_trainings: List[TrainingRecommendation]

@router.get("/recommendations/{employee_id}", response_model=RecommendationResponse)
def get_recommendations(employee_id: int, topn: int = 5):
    con = create_connection()
    employees = get_employees(con)
    trainings = get_trainings(con)
    employee_skills = get_employee_skills(con)
    training_need = get_training_need(con)
    training_history = get_training_history(con)
    if employee_id not in set(employees['id']):
        raise HTTPException(status_code=404, detail="Employee not found")
    recommender = HybridRecommender()
    recommender.fit(employees, trainings, employee_skills, training_history, training_need)
    recommended = recommender.recommend(employee_id, topn=topn)
    # Map scores to training info
    id_to_score = {r['id']: r['score'] for r in recommended}
    recommended_trainings = trainings[trainings['id'].isin(id_to_score.keys())].copy()
    recommended_trainings['recommendation_score'] = recommended_trainings['id'].map(id_to_score)
    # Sort by score descending
    recommended_trainings = recommended_trainings.sort_values('recommendation_score', ascending=False)
    # Ensure every training has a recommendation_score (default 0.0 if missing)
    result = []
    for row in recommended_trainings.itertuples(index=False):
        d = row._asdict() if hasattr(row, '_asdict') else dict(zip(row._fields, row))
        d['recommendation_score'] = float(id_to_score.get(d['id'], 0.0))
        # Ensure all required fields for TrainingRecommendation
        for field in ['description', 'start_date', 'end_date']:
            if field not in d:
                d[field] = None
        result.append(TrainingRecommendation(**d))
    return RecommendationResponse(recommended_trainings=result)
