"""
ML retraining logic for feedback events.
This module provides a function to retrain or update the ML recommender for a specific employee after feedback is received.
"""
from app.ml_recommender import HybridRecommender
from app.database import fetch_results

def retrain_recommender_on_feedback(employee_id: int, topn: int = 10):
    """
    Retrain or update the ML recommender for the given employee after feedback.
    This can be called after a feedback event to immediately update recommendations.
    """
    # Fetch job title and department for the employee
    emp_result = fetch_results("SELECT job_title, department FROM employee WHERE id = %s", (employee_id,))
    if not emp_result or not emp_result[0].get('job_title'):
        return False
    job_title = emp_result[0]['job_title']
    department = emp_result[0].get('department', '')
    recommender = HybridRecommender()
    # Run the recommender logic (can be replaced with actual retraining if needed)
    rec_skills = recommender.fetch_trending_skills_from_web(topn=topn, employee_id=employee_id)
    # ... Optionally update DB or cache with new recommendations ...
    return True
