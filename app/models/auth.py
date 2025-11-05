
"""
Authentication endpoints and utilities for the HR Management system.
Handles JWT-based login, password hashing, and user info retrieval.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from pydantic import BaseModel
import datetime
import os
from app.database.database import fetch_results, execute_query

router = APIRouter()

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")  # set in env in production
ALGORITHM = "HS256"
# token lifetime in minutes
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def _prepare_password_bytes(password: str) -> bytes:
    """Encode password to UTF-8 bytes and truncate to 72 bytes (bcrypt limit).

    bcrypt has a 72-byte input limit. Explicitly truncating here avoids
    backend errors and ensures consistent behavior across environments.
    """
    if password is None:
        return b""
    b = password.encode("utf-8")
    if len(b) > 72:
        b = b[:72]
    return b


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hashed password using the bcrypt lib.

    Returns True on match, False otherwise.
    """
    try:
        pw = _prepare_password_bytes(plain_password)
        if isinstance(hashed_password, str):
            hashed_b = hashed_password.encode("utf-8")
        else:
            hashed_b = hashed_password
        return bcrypt.checkpw(pw, hashed_b)
    except Exception as e:
        print(f"bcrypt checkpw error: {e}")
        return False


# Backwards-compatible helper used elsewhere in the codebase (e.g. employee.py)
# Some modules import `pwd_context` and call `pwd_context.hash(password)`; to
# avoid changing many files, provide a tiny compatibility object with a `hash`
# method that uses bcrypt under the hood.
def hash_password(password: str) -> str:
    pw = _prepare_password_bytes(password)
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


class _PwdContextCompat:
    @staticmethod
    def hash(password: str) -> str:
        return hash_password(password)


# Expose `pwd_context` for compatibility with previous code that used
# `passlib.context.CryptContext`'s `hash()` method.
pwd_context = _PwdContextCompat()

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

def create_access_token_cookie(response: Response, data: dict, expires_delta: datetime.timedelta | None = None):
    token = create_access_token(data=data, expires_delta=expires_delta)
    # set cookie (httpOnly) - secure flag should be true in production
    secure_flag = os.getenv("ENV", "development") == "production"
    max_age = int((expires_delta or datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)).total_seconds())
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=secure_flag,
        samesite="lax",
        max_age=max_age,
        expires=max_age,
        path='/'
    )
    return token


def _get_token_from_request(request: Request):
    # Prefer cookie-based token
    token = None
    if request.cookies.get("access_token"):
        token = request.cookies.get("access_token")
    else:
        # fallback to Authorization header
        auth: str | None = request.headers.get("authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]
    return token


def get_current_user(request: Request, response: Response):
    """Get the current user from JWT stored in cookie or Authorization header.
    Also refreshes the cookie expiry (sliding session) on each successful call.
    """
    token = _get_token_from_request(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        query = "SELECT * FROM users WHERE email = %s"
        users = fetch_results(query, (email,))
        if not users:
            raise HTTPException(status_code=404, detail="User not found")
        user = users[0]
        # refresh cookie to extend session (sliding expiration)
        try:
            expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            create_access_token_cookie(response, {"sub": user['email'], "id": user['id'], "role": user.get('role')}, expires_delta=expires)
        except Exception:
            # non-fatal if cookie refresh fails
            pass
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/login", response_model=Token)
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
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
    expires = datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email'], "id": user['id'], "role": user['role']},
        expires_delta=expires
    )
    # set httpOnly cookie
    create_access_token_cookie(response, {"sub": user['email'], "id": user['id'], "role": user['role']}, expires_delta=expires)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    """Clear the session cookie to log the user out."""
    response.delete_cookie("access_token", path='/')
    return {"msg": "logged out"}

@router.get("/me")
def read_users_me(current_user=Depends(get_current_user)):
    """Get the current user's information from the JWT token, returning the employee id if available."""
    # Try to find the employee record matching the user's email
    query = "SELECT id, role, email FROM employee WHERE email = %s"
    employees = fetch_results(query, (current_user['email'],))
    if employees:
        emp = employees[0]
        return {
            "id": emp['id'],
            "email": emp['email'],
            "role": emp['role']
        }
    # Fallback to users table info if not found in employee
    return {
        "id": current_user['id'],
        "email": current_user['email'],
        "role": current_user['role']
    }


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(data: PasswordChange, current_user=Depends(get_current_user)):
    """Change the authenticated user's password.
    Verifies the provided current password and updates the stored hashed password.
    """
    # current_user is loaded from the users table by get_current_user
    if not verify_password(data.current_password, current_user.get('hashed_password', '')):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password incorrect")
    # Don't allow setting the same password as the current one
    if verify_password(data.new_password, current_user.get('hashed_password', '')):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different from the current password")
    # Hash the new password and update the users table
    new_hashed = pwd_context.hash(data.new_password)
    try:
        execute_query("UPDATE users SET hashed_password = %s WHERE id = %s", (new_hashed, current_user['id']))
    except Exception as e:
        print(f"Failed to update password for user {current_user.get('email')}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update password")
    return {"msg": "Password updated successfully"}
