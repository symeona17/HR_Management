from fastapi import FastAPI, Query, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import datetime

from app.models.employee import router as employee_router, search_employee
from app.models.skill import router as skills_router
from app.models.training import get_all_trainings, add_training, delete_training


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers from employees and skills modules

app.include_router(employee_router, prefix="/employee", tags=["employee"])
app.include_router(skills_router, prefix="/skill", tags=["skill"])

# Endpoint to delete a training (now correctly placed)
@app.delete("/training/{training_id}")
def remove_training(training_id: int):
    try:
        delete_training(training_id)
        return {"message": "Training deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {e}")

# Endpoint to get all trainings
@app.get("/training/")
def get_trainings():
    try:
        results = get_all_trainings()
        return {"trainings": results}
    except Exception as e:
        return {"error": str(e)}

# Endpoint to create a new training
from pydantic import BaseModel

class TrainingCreate(BaseModel):
    title: str
    description: str
    start_date: str
    end_date: str
    category: str

@app.post("/training/")
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

@app.get("/")
def read_root():
    return {"message": "Welcome to the HR Management API"}

@app.get("/search-employee")
def search_employee_endpoint(
    name: str = Query(None, max_length=100),
    surname: str = Query(None, max_length=100),
    email: str = Query(None, max_length=255),
    department: str = Query(None, max_length=100),
    job_title: str = Query(None, max_length=100)
):
    try:
        # Search for employees based on query parameters
        results = search_employee(name, surname, email, department, job_title)
        if results:
            return {"employees": results}
        else:
            return {"message": "No employees found matching the criteria."}
    except Exception as e:
        return {"error": str(e)}

# --- JWT CONFIG ---
SECRET_KEY = "your-secret-key"  # Change this!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# --- PASSWORD HASHING ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: datetime.timedelta = None):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- USER DB ACCESS ---
from app.database.database import fetch_results

# --- TOKEN SCHEMA ---
from pydantic import BaseModel
class Token(BaseModel):
    access_token: str
    token_type: str

# --- LOGIN ENDPOINT ---
@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Fetch user by email
    query = "SELECT * FROM users WHERE email = %s"
    users = fetch_results(query, (form_data.username,))
    if not users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    user = users[0]
    if not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(
        data={"sub": user['email'], "id": user['id'], "role": user['role']},
        expires_delta=datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- PROTECTED ENDPOINT EXAMPLE ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        query = "SELECT * FROM users WHERE email = %s"
        users = fetch_results(query, (email,))
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        return users[0]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/me")
def read_users_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user['id'],
        "email": current_user['email'],
        "role": current_user['role']
    }