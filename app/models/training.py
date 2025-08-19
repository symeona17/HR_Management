
# --- FastAPI Router and Pydantic Models for Training Endpoints ---
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

router = APIRouter()

class AssignmentRequest(BaseModel):
    employee_id: int
    training_id: int

class TrainerAssignmentRequest(BaseModel):
    trainer_id: int
    training_id: int

@router.get("/employee/{employee_id}/assigned-trainings")
def get_assigned_trainings(employee_id: int):
    try:
        results = get_employee_training(employee_id)
        return {"trainings": results}
    except Exception as e:
        return {"error": str(e)}

@router.post("/employee_training/")
def assign_employee(request: AssignmentRequest):
    try:
        assign_employee_to_training(request.employee_id, request.training_id)
        return {"message": "Employee assigned to training successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

@router.delete("/employee_training/")
def remove_employee(employee_id: int = Body(...), training_id: int = Body(...)):
    try:
        remove_employee_from_training(employee_id, training_id)
        return {"message": "Employee removed from training successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

@router.post("/trainer_training/")
def assign_trainer(request: TrainerAssignmentRequest):
    try:
        assign_trainer_to_training(request.trainer_id, request.training_id)
        return {"message": "Trainer assigned to training successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

@router.delete("/trainer_training/")
def remove_trainer(trainer_id: int = Body(...), training_id: int = Body(...)):
    try:
        remove_trainer_from_training(trainer_id, training_id)
        return {"message": "Trainer removed from training successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

@router.delete("/training/{training_id}")
def remove_training(training_id: int):
    try:
        delete_training(training_id)
        return {"message": "Training deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

@router.get("/training/")
def get_trainings():
    try:
        results = get_all_trainings()
        return {"trainings": results}
    except Exception as e:
        return {"error": str(e)}


class TrainingCreate(BaseModel):
    title: str
    description: str
    start_date: str
    end_date: str
    category: str

# Update an existing training
from fastapi import Path
@router.put("/training/{training_id}")
def update_training(
    training_id: int = Path(..., description="The ID of the training to update"),
    training: TrainingCreate = Body(...)
):
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
# Assign an employee to a training
def assign_employee_to_training(employee_id, training_id):
    query = "INSERT INTO employee_training (employee_id, training_id) VALUES (%s, %s)"
    values = (employee_id, training_id)
    execute_query(query, values)

# Remove an employee from a training
def remove_employee_from_training(employee_id, training_id):
    query = "DELETE FROM employee_training WHERE employee_id = %s AND training_id = %s"
    values = (employee_id, training_id)
    execute_query(query, values)

# Assign a trainer to a training
def assign_trainer_to_training(trainer_id, training_id):
    query = "INSERT INTO trainer_training (trainer_id, training_id) VALUES (%s, %s)"
    values = (trainer_id, training_id)
    execute_query(query, values)

# Remove a trainer from a training
def remove_trainer_from_training(trainer_id, training_id):
    query = "DELETE FROM trainer_training WHERE trainer_id = %s AND training_id = %s"
    values = (trainer_id, training_id)
    execute_query(query, values)
# Function to delete a training by id
def delete_training(training_id):
    query = "DELETE FROM training WHERE id = %s"
    values = (training_id,)
    execute_query(query, values)
# app/models/training.py
from app.database import execute_query, fetch_results

# Function to add a new training
def add_training(title, description, start_date, end_date, category):
    query = """
    INSERT INTO training (title, description, start_date, end_date, category)
    VALUES (%s, %s, %s, %s, %s)
    """
    values = (title, description, start_date, end_date, category)
    execute_query(query, values)

# Function to add a training need for an employee
def add_training_need(employee_id, recommended_training_id, recommendation_level):
    # Ensure the recommendation level is between 1 and 5
    if not (1 <= recommendation_level <= 5):  
        raise ValueError("Recommendation level must be between 1 and 5")
    
    query = """
    INSERT INTO training_need (employee_id, recommended_training_id, recommendation_level)
    VALUES (%s, %s, %s)
    """
    values = (employee_id, recommended_training_id, recommendation_level)
    execute_query(query, values)

# Function to fetch all trainings
def get_all_trainings():
    query = """
    SELECT id AS training_id, title, description, start_date, end_date, category
    FROM training
    """
    results = fetch_results(query)
    return results

# Function to fetch all trainings for a specific employee, including training needs and recommendation levels
def get_employee_training(employee_id):
    query = """
    SELECT t.id AS training_id, t.title, t.description, t.start_date, t.end_date, t.category
    FROM training t
    INNER JOIN employee_training et ON t.id = et.training_id
    WHERE et.employee_id = %s
    """
    results = fetch_results(query, (employee_id,))
    return results
