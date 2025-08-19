"""
Manager endpoints and utility functions for the HR Management system.
Handles team management and analytics for managers.
"""

from fastapi import APIRouter, Body
from app.database import fetch_results

router = APIRouter()

@router.get("/{manager_id}/team")
def get_manager_team(manager_id: int):
    """Get all employees reporting to a manager (uses manager_id)."""
    query = "SELECT * FROM employee WHERE manager_id = %s"
    results = fetch_results(query, (manager_id,))
    return {"team": results}

@router.get("/{manager_id}/team-analytics")
def get_manager_team_analytics(manager_id: int):
    """Get analytics for a manager's team: training completion, skill gaps, feedback summary."""
    query = """
        SELECT e.id AS employee_id, e.first_name, e.last_name,
               COUNT(DISTINCT et.training_id) AS trainings_completed,
               AVG(f.sentiment_score) AS avg_feedback
        FROM employee e
        LEFT JOIN employee_training et ON e.id = et.employee_id
        LEFT JOIN feedback f ON e.id = f.employee_id
        WHERE e.manager_id = %s
        GROUP BY e.id
    """
    results = fetch_results(query, (manager_id,))
    return {"analytics": results}
