
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
    name: str
    category: str

def insert_skill(skill: Skill):
    """Insert a new skill into the database."""
    conn = create_connection()
    cursor = conn.cursor()
    query = """
    INSERT INTO skill (name, category)
    VALUES (%s, %s)
    """
    values = (skill.name, skill.category)
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

@router.get("/")
def get_skills():
    """Get all skills."""
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM skill")
    skill = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"skill": skill}
