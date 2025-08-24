
"""
Skill endpoints and models for the HR Management system.
Handles CRUD operations for skills.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mysql.connector
from app.database import create_connection

router = APIRouter()


class Skill(BaseModel):
    """Request/response model for skill records."""
    preferred_label: str
    skill_type: str = None
    reuse_level: str = None
    alt_labels: str = None


def insert_skill(skill: Skill):
    """Insert a new skill into the database."""
    conn = create_connection()
    cursor = conn.cursor()
    query = """
    INSERT INTO skill (preferred_label, skill_type, reuse_level, alt_labels)
    VALUES (%s, %s, %s, %s)
    """
    values = (skill.preferred_label, skill.skill_type, skill.reuse_level, skill.alt_labels)
    cursor.execute(query, values)
    conn.commit()
    cursor.close()
    conn.close()


@router.post("/")
def create_skill(skill: Skill):
    """Create a new skill record."""
    try:
        insert_skill(skill)
        return {"message": "Skill created successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")



from fastapi import Query

@router.get("/")
def get_skills(limit: int = Query(50, ge=1, le=100)):
    """Get up to 'limit' skills (default 50, max 100)."""
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, preferred_label, skill_type, reuse_level, alt_labels FROM skill LIMIT %s", (limit,))
    skills = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"skills": skills}

@router.get("/search")
def search_skills(q: str):
    """Search skills by preferred_label or alt_labels (case-insensitive, partial match), up to 25 results."""
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    like = f"%{q}%"
    cursor.execute(
        """
        SELECT id, preferred_label, skill_type, reuse_level, alt_labels
        FROM skill
        WHERE LOWER(preferred_label) LIKE LOWER(%s) OR LOWER(alt_labels) LIKE LOWER(%s)
        LIMIT 25
        """,
        (like, like)
    )
    skills = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"skills": skills}