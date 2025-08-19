
"""
Training endpoints and utility functions for the HR Management system.
Handles CRUD operations for trainings, employee-training assignments, and trainer-training assignments.
"""


from fastapi import APIRouter, HTTPException, Body, Path
from pydantic import BaseModel
from typing import List, Dict
router = APIRouter()


# --- TRAINER ENDPOINTS ---
@router.get("/trainer/{trainer_id}/trainings")
def get_trainings_for_trainer(trainer_id: int):
    """Get all trainings assigned to a specific trainer."""
    query = """
        SELECT t.* FROM training t
        INNER JOIN trainer_training tt ON t.id = tt.training_id
        WHERE tt.trainer_id = %s
    """
    results = fetch_results(query, (trainer_id,))
    return {"trainings": results}

@router.get("/trainer/{trainer_id}/feedback")
def get_feedback_for_trainer_trainings(trainer_id: int):
    """Get all feedback for trainings conducted by a specific trainer."""
    query = """
        SELECT f.* FROM feedback f
        INNER JOIN employee_training et ON f.employee_id = et.employee_id
        INNER JOIN trainer_training tt ON et.training_id = tt.training_id
        WHERE tt.trainer_id = %s
    """
    results = fetch_results(query, (trainer_id,))
    return {"feedback": results}





class AssignmentRequest(BaseModel):
    """Request model for assigning an employee to a training."""
    employee_id: int
    training_id: int


class TrainerAssignmentRequest(BaseModel):
    """Request model for assigning a trainer to a training."""
    trainer_id: int
    training_id: int


@router.get("/employee/{employee_id}/assigned-trainings")
def get_assigned_trainings(employee_id: int):
    """Get all trainings assigned to a specific employee."""
    try:
        results = get_employee_training(employee_id)
        return {"trainings": results}
    except Exception as e:
        return {"error": str(e)}


@router.post("/employee_training/")
def assign_employee(request: AssignmentRequest):
    """Assign an employee to a training."""
    try:
        assign_employee_to_training(request.employee_id, request.training_id)
        return {"message": "Employee assigned to training successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


@router.delete("/employee_training/")
def remove_employee(employee_id: int = Body(...), training_id: int = Body(...)):
    """Remove an employee from a training."""
    try:
        remove_employee_from_training(employee_id, training_id)
        return {"message": "Employee removed from training successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


@router.post("/trainer_training/")
def assign_trainer(request: TrainerAssignmentRequest):
    """Assign a trainer to a training."""
    try:
        assign_trainer_to_training(request.trainer_id, request.training_id)
        return {"message": "Trainer assigned to training successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


@router.delete("/trainer_training/")
def remove_trainer(trainer_id: int = Body(...), training_id: int = Body(...)):
    """Remove a trainer from a training."""
    try:
        remove_trainer_from_training(trainer_id, training_id)
        return {"message": "Trainer removed from training successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


@router.delete("/training/{training_id}")
def remove_training(training_id: int):
    """Delete a training by its ID."""
    try:
        delete_training(training_id)
        return {"message": "Training deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


@router.get("/training/")
def get_trainings():
    """Get all trainings."""
    try:
        results = get_all_trainings()
        return {"trainings": results}
    except Exception as e:
        return {"error": str(e)}



class TrainingCreate(BaseModel):
    """Request model for creating or updating a training."""
    title: str
    description: str
    start_date: str
    end_date: str
    category: str


@router.put("/training/{training_id}")
def update_training(
    training_id: int = Path(..., description="The ID of the training to update"),
    training: TrainingCreate = Body(...)
):
    """Update an existing training by its ID."""
    try:
        query = """
            UPDATE training SET title = %s, description = %s, start_date = %s, end_date = %s, category = %s
            WHERE id = %s
        """
        values = (
            training.title,
            training.description,
            training.start_date,
            training.end_date,
            training.category,
            training_id
        )
        execute_query(query, values)
        return {"message": "Training updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


@router.post("/training/")
def create_training(training: TrainingCreate):
    """Create a new training."""
    try:
        add_training(
            training.title,
            training.description,
            training.start_date,
            training.end_date,
            training.category
        )
        return {"message": "Training created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

def assign_employee_to_training(employee_id, training_id):
    """Assign an employee to a training in the database."""
    query = "INSERT INTO employee_training (employee_id, training_id) VALUES (%s, %s)"
    values = (employee_id, training_id)
    execute_query(query, values)

def remove_employee_from_training(employee_id, training_id):
    """Remove an employee from a training in the database."""
    query = "DELETE FROM employee_training WHERE employee_id = %s AND training_id = %s"
    values = (employee_id, training_id)
    execute_query(query, values)

def assign_trainer_to_training(trainer_id, training_id):
    """Assign a trainer to a training in the database."""
    query = "INSERT INTO trainer_training (trainer_id, training_id) VALUES (%s, %s)"
    values = (trainer_id, training_id)
    execute_query(query, values)

def remove_trainer_from_training(trainer_id, training_id):
    """Remove a trainer from a training in the database."""
    query = "DELETE FROM trainer_training WHERE trainer_id = %s AND training_id = %s"
    values = (trainer_id, training_id)
    execute_query(query, values)

def delete_training(training_id):
    """Delete a training by its ID in the database."""
    query = "DELETE FROM training WHERE id = %s"
    values = (training_id,)
    execute_query(query, values)

from app.database import execute_query, fetch_results

def add_training(title, description, start_date, end_date, category):
    """Add a new training to the database."""
    query = """
    INSERT INTO training (title, description, start_date, end_date, category)
    VALUES (%s, %s, %s, %s, %s)
    """
    values = (title, description, start_date, end_date, category)
    execute_query(query, values)

def add_training_need(employee_id, recommended_training_id, recommendation_level):
    """Add a training need for an employee with a recommendation level (1-5)."""
    if not (1 <= recommendation_level <= 5):  
        raise ValueError("Recommendation level must be between 1 and 5")
    query = """
    INSERT INTO training_need (employee_id, recommended_training_id, recommendation_level)
    VALUES (%s, %s, %s)
    """
    values = (employee_id, recommended_training_id, recommendation_level)
    execute_query(query, values)

def get_all_trainings():
    """Fetch all trainings from the database."""
    query = """
    SELECT id AS training_id, title, description, start_date, end_date, category
    FROM training
    """
    results = fetch_results(query)
    return results

def get_employee_training(employee_id):
    """Fetch all trainings assigned to a specific employee."""
    query = """
    SELECT t.id AS training_id, t.title, t.description, t.start_date, t.end_date, t.category
    FROM training t
    INNER JOIN employee_training et ON t.id = et.training_id
    WHERE et.employee_id = %s
    """
    results = fetch_results(query, (employee_id,))
    return results
