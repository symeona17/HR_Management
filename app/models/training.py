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
