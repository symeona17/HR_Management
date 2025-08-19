
"""
Authentication endpoints and utilities for the HR Management system.
Handles JWT-based login, password hashing, and user info retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
import datetime
from app.database.database import fetch_results

router = APIRouter()

# JWT configuration
SECRET_KEY = "your-secret-key"  # Change this!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Verify a plain password against a hashed password."""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: datetime.timedelta = None):
    """Create a JWT access token with an optional expiration delta."""
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class Token(BaseModel):
    """Response model for JWT access tokens."""
    access_token: str
    token_type: str

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get the current user from a JWT token."""
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

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate a user and return a JWT access token."""
    query = "SELECT * FROM users WHERE email = %s"
    users = fetch_results(query, (form_data.username,))
    if not users:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    user = users[0]
    try:
        if not verify_password(form_data.password, user['hashed_password']):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    except Exception as e:
        print(f"Password verification error for user {user['email']}: {e}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Password verification failed: {str(e)}")
    access_token = create_access_token(
        data={"sub": user['email'], "id": user['id'], "role": user['role']},
        expires_delta=datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def read_users_me(current_user=Depends(get_current_user)):
    """Get the current user's information from the JWT token."""
    return {
        "id": current_user['id'],
        "email": current_user['email'],
        "role": current_user['role']
    }
