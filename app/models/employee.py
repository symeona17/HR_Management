
"""
Employee endpoints and models for the HR Management system.
Handles CRUD operations and search for employees, including skills and training assignments.
"""

from fastapi import APIRouter, HTTPException
from fastapi import Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import mysql.connector
from app.database import create_connection, fetch_results
from app.models.training import add_training, add_training_need, get_employee_training
from app.ml_recommender import HybridRecommender, get_employees, get_trainings, get_employee_skills, get_training_history, get_training_need
from app.ml_feedback_training import retrain_recommender_on_feedback
from typing import List, Optional
import threading

def get_employee_skills(employee_id: int):
    """Fetch all skills for a given employee."""
    query = '''
    SELECT s.id, s.preferred_label, es.proficiency_level
    FROM employee_skill es
    JOIN skill s ON es.skill_id = s.id
    WHERE es.employee_id = %s
    '''
    return fetch_results(query, (employee_id,))

router = APIRouter()




# --- Split: DB update and ML retraining ---
def update_skill_feedback_db(employee_id: int, skill_id: int, vote: str):
    """
    Update the recommendation_score for a skill suggestion in the DB and log the vote in skill_feedback.
    """
    if vote not in ('up', 'down'):
        return {"error": "Invalid vote. Use 'up' or 'down'."}
    con = create_connection()
    cursor = con.cursor()
    score_change = 5 if vote == 'up' else -5
    # Log the vote in skill_feedback table
    cursor.execute(
        "INSERT INTO skill_feedback (employee_id, skill_id, vote) VALUES (%s, %s, %s)",
        (employee_id, skill_id, vote)
    )
    # Update the score in skill_need table
    cursor.execute(
        "UPDATE skill_need SET recommendation_score = GREATEST(0, LEAST(100, recommendation_score + %s)) WHERE employee_id = %s AND skill_id = %s",
        (score_change, employee_id, skill_id)
    )
    con.commit()
    cursor.close()
    con.close()
    return {"success": True, "skill_id": skill_id, "vote": vote, "score_change": score_change}

def trigger_skill_feedback_ml_async(employee_id: int):
    """
    Trigger ML retraining/update for this employee after feedback, asynchronously.
    """
    thread = threading.Thread(target=retrain_recommender_on_feedback, args=(employee_id,))
    thread.daemon = True
    thread.start()
    return {"ml_retraining_started": True}

@router.post("/{employee_id}/skill-feedback")
def skill_feedback(employee_id: int, skill_id: int = Body(...), vote: str = Body(...)):
    """
    Log feedback and update recommendation_score for a skill suggestion, then trigger ML retraining asynchronously.
    """
    db_result = update_skill_feedback_db(employee_id, skill_id, vote)
    if "error" in db_result:
        return JSONResponse(status_code=400, content=db_result)
    # Start ML retraining in the background
    ml_result = trigger_skill_feedback_ml_async(employee_id)
    return {**db_result, **ml_result}

# --- ML/AI Calculation Endpoint: Calculate and Insert Skills ---
@router.post("/ml-calculate-skills/{employee_id}", operation_id="ml_calculate_and_insert_skills")
def ml_calculate_and_insert_skills(employee_id: int, topn: int = 10):
    """
    Run the ML/AI recommender (web/hardcoded/ML logic, no DB filtering),
    insert any new recommended skills into the DB, and update the score if the skill already exists.
    Fetches the employee's job title and passes it to the ML recommender.
    """
    con = create_connection()
    from app.database import fetch_results, execute_query
    # Fetch job title and department for the employee
    emp_result = fetch_results("SELECT job_title, department FROM employee WHERE id = %s", (employee_id,))
    if not emp_result or not emp_result[0].get('job_title'):
        raise HTTPException(status_code=404, detail="Employee or job title not found")
    job_title = emp_result[0]['job_title']
    department = emp_result[0].get('department', '')
    # Debug: print input features
    print(f"[DEBUG] ML input features: job_title='{job_title}', department='{department}' for employee_id={employee_id}")
    recommender = HybridRecommender()
    rec_skills = recommender.fetch_trending_skills_from_web(topn=topn, employee_id=employee_id)
    # Filter out skills the employee already has
    existing_skills = set(s['preferred_label'].lower() for s in get_employee_skills(employee_id))
    filtered_skills = [s for s in rec_skills if s.get('preferred_label', s.get('name', '')).lower() not in existing_skills]
    db_skills = fetch_results("SELECT id, preferred_label FROM skill", ())
    skill_map = { s['preferred_label'].lower(): s for s in db_skills }
    for s in filtered_skills:
        key = s.get('preferred_label', s.get('name', '')).lower()
        if key in skill_map:
            # Update preferred_label if needed (no score column in schema)
            try:
                execute_query("UPDATE skill SET preferred_label = %s WHERE id = %s", (s.get('preferred_label', s.get('name', '')), skill_map[key]['id']))
            except Exception:
                pass
            s['id'] = skill_map[key]['id']
        else:
            # Insert new skill (no score column in schema)
            new_id = execute_query("INSERT INTO skill (preferred_label) VALUES (%s)", (s.get('preferred_label', s.get('name', '')),))
            s['id'] = new_id
            skill_map[key] = {"id": new_id, "preferred_label": s.get('preferred_label', s.get('name', ''))}
        # Insert or update skill_need (recommendation)
        try:
            execute_query(
                "INSERT INTO skill_need (skill_id, employee_id, recommendation_score) VALUES (%s, %s, %s) "
                "ON DUPLICATE KEY UPDATE recommendation_score = VALUES(recommendation_score)",
                (s['id'], employee_id, s.get('recommendation_score'))
            )
        except Exception as e:
            print(f"Failed to insert/update skill_need: {e}")
    # Placeholder: collect user feedback on recommendations (future work)
    # e.g., store feedback in a table, or log for analysis
    #print(f"[DEBUG] Final recommended skills (after filtering): {filtered_skills}")
    return {"recommended_skills": filtered_skills}

# --- DB-Only Endpoint: Read Skills from DB ---
@router.get("/db-skills/{employee_id}", operation_id="db_only_skills")
def db_only_skills(employee_id: int, topn: int = 10):
    """
    Read and return skills from the DB only (no ML/AI logic).
    """
    con = create_connection()
    # Get all skills from DB
    db_skills = fetch_results("SELECT id, preferred_label FROM skill LIMIT %s", (topn,))
    return {"db_skills": db_skills}

@router.get("/{employee_id}", operation_id="get_employee_by_id")
def get_employee_by_id(employee_id: int):
    """Get a single employee by ID, including skills and ongoing trainings."""
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employee WHERE id = %s", (employee_id,))
    employee = cursor.fetchone()
    cursor.close()
    conn.close()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    # Fetch skills for this employee
    skills = get_employee_skills(employee_id)
    employee["skills"] = skills
    # Fetch ongoing trainings for this employee
    from app.models.training import get_employee_training
    import datetime
    trainings = get_employee_training(employee_id)
    today = datetime.date.today()
    ongoing = []
    for t in trainings:
        try:
            end_date = t.get('end_date')
            if end_date and str(end_date) >= str(today):
                ongoing.append(f"{t['title']} ({t['category']})")
        except Exception:
            continue
    employee["trainings"] = ongoing
    return employee


from app.models.auth import pwd_context

class Employee(BaseModel):
    """Request/response model for employee records."""
    first_name: str
    last_name: str
    email: str
    hire_date: str
    department: str
    job_title: str
    details: str = ""



def insert_employee(employee: Employee):
    """Insert a new employee into the database, with default password '1234' hashed."""
    conn = create_connection()
    cursor = conn.cursor()
    # Hash the default password
    default_password = "1234"
    hashed_password = pwd_context.hash(default_password)
    query = """
    INSERT INTO employee (first_name, last_name, email, hire_date, department, job_title, details, hashed_password)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    values = (employee.first_name, employee.last_name, employee.email, employee.hire_date, employee.department, employee.job_title, employee.details, hashed_password)
    cursor.execute(query, values)
    conn.commit()
    cursor.close()
    conn.close()


@router.post("/")
def create_employee(employee: Employee):
    """Create a new employee record."""
    try:
        insert_employee(employee)
        return {"message": "Employee created successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")


@router.get("/", operation_id="get_all_employees")
def get_employee():
    """Get all employees."""
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM employee")
    employee = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"employee": employee}


@router.put("/{employee_id}")
def update_employee(employee_id: int, employee: Employee):
    """Update an existing employee record by ID."""
    conn = create_connection()
    cursor = conn.cursor()
    query = """
    UPDATE employee
    SET first_name = %s, last_name = %s, email = %s, hire_date = %s, department = %s, job_title = %s, details = %s
    WHERE id = %s
    """
    values = (employee.first_name, employee.last_name, employee.email, employee.hire_date, employee.department, employee.job_title, employee.details, employee_id)
    cursor.execute(query, values)
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Employee updated successfully"}


@router.delete("/{employee_id}")
def delete_employee(employee_id: int):
    """Delete an employee by ID."""
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM employee WHERE id = %s", (employee_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Employee deleted successfully"}



def search_employee(name=None, surname=None, email=None, department=None, job_title=None):
    """Search employees by various attributes and return detailed data, including trainings and feedback."""
    query = """
    SELECT e.id AS employee_id, e.first_name, e.last_name, e.email, e.hire_date, e.department, e.job_title,
           GROUP_CONCAT(DISTINCT CONCAT(t.title, ' (', t.category, ')') ORDER BY t.title) AS training,
           GROUP_CONCAT(DISTINCT CONCAT(feedback.feedback_date, ' - ', feedback.sentiment_score, ' - ', feedback.comments) ORDER BY feedback.feedback_date) AS feedback,
           GROUP_CONCAT(DISTINCT CONCAT(t2.title, ' (', tn.recommendation_level, '/5)') ORDER BY tn.recommended_training_id) AS training_need
    FROM employee e
    LEFT JOIN employee_training et ON e.id = et.employee_id
    LEFT JOIN training t ON et.training_id = t.id
    LEFT JOIN feedback ON e.id = feedback.employee_id
    LEFT JOIN training_need tn ON e.id = tn.employee_id
    LEFT JOIN training t2 ON tn.recommended_training_id = t2.id
    WHERE 1=1
    """
    values = []
    # OR logic: if any field is provided, match any of them
    or_clauses = []
    if name:
        or_clauses.append("e.first_name LIKE %s")
        values.append(f"%{name}%")
    if surname:
        or_clauses.append("e.last_name LIKE %s")
        values.append(f"%{surname}%")
    if email:
        or_clauses.append("e.email LIKE %s")
        values.append(f"%{email}%")
    if department:
        or_clauses.append("e.department LIKE %s")
        values.append(f"%{department}%")
    if job_title:
        or_clauses.append("e.job_title LIKE %s")
        values.append(f"%{job_title}%")
    if or_clauses:
        query += " AND (" + " OR ".join(or_clauses) + ")"
    query += " GROUP BY e.id;"  # Ensure that we group by employee_id
    results = fetch_results(query, tuple(values))
    return {"employee": results}

from typing import Union
class SkillRecommendation(BaseModel):
    skill_id: Union[int, str]
    skill_name: str
    category: Optional[str]
    score: float

class CategoryRecommendation(BaseModel):
    category: str
    score: float

class RecommendedSkillsResponse(BaseModel):
    recommended_skills: List[SkillRecommendation]
    recommended_categories: List[CategoryRecommendation]


# --- ML Suggested Skills Endpoint and Models ---
from typing import Union

class SuggestedSkill(BaseModel):
    skill_id: Union[int, str]
    skill_name: str
    category: str
    score: float

class SuggestedSkillsResponse(BaseModel):
    suggested_skills: list[SuggestedSkill]




@router.get("/{employee_id}/suggested-skills", response_model=SuggestedSkillsResponse, operation_id="get_suggested_skills")
def get_suggested_skills(employee_id: int):
    """
    Return the current recommended skills for the employee from the skill_need table (DB-driven, not ML-generated).
    """
    con = create_connection()
    cursor = con.cursor(dictionary=True)
    cursor.execute("""
        SELECT s.id as skill_id, s.preferred_label as skill_name, s.skill_type, sn.recommendation_score as score
        FROM skill_need sn
        JOIN skill s ON sn.skill_id = s.id
        WHERE sn.employee_id = %s
        ORDER BY sn.recommendation_score DESC
    """, (employee_id,))
    skills = cursor.fetchall()
    cursor.close()
    con.close()
    suggested_skills = [
        SuggestedSkill(
            skill_id=rec['skill_id'],
            skill_name=rec['skill_name'],
            category=rec.get('skill_type', ''),
            score=rec.get('score', 0)
        )
        for rec in skills
    ]
    return SuggestedSkillsResponse(suggested_skills=suggested_skills)

