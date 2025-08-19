


from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from app.models.training import (
    assign_employee_to_training, remove_employee_from_training,
    assign_trainer_to_training, remove_trainer_from_training,
    delete_training, get_all_trainings, add_training, get_employee_training
)

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
