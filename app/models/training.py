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
    SELECT t.id AS training_id, t.title, t.description, t.start_date, t.end_date, t.category,
           tn.recommendation_level
    FROM training t
    LEFT JOIN training_need tn ON t.id = tn.recommended_training_id
    WHERE tn.employee_id = %s
    """
    results = fetch_results(query, (employee_id,))
    return results
