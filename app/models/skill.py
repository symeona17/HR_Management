# app/skills.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import mysql.connector
from app.database import create_connection

router = APIRouter()

# Pydantic model for Skill
class Skill(BaseModel):
    name: str
    category: str

# Function to insert skill into the database
def insert_skill(skill: Skill):
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

# Route to create a new skill
@router.post("/")
def create_skill(skill: Skill):
    try:
        insert_skill(skill)
        return {"message": "Skill created successfully"}
    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

# Route to get all skills
@router.get("/")
def get_skills():
    conn = create_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM skill")
    skill = cursor.fetchall()
    cursor.close()
    conn.close()
    return {"skill": skill}
