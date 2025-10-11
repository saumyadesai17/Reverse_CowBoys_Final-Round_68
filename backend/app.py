from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from bson import ObjectId
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re
from pymongo import MongoClient
from typing import Optional

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Auth API",
    description="Simple authentication API with signup, login, and profile management",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.auth_db

# Test MongoDB connection on startup
try:
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    print(f"Database: {db.name}")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("Please check your MongoDB URI and network connection")

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Pydantic models
class UserSignup(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenVerify(BaseModel):
    token: str

class UserProfile(BaseModel):
    user_id: str
    email: str
    created_at: str

class TokenResponse(BaseModel):
    message: str
    token: str
    user_id: str

class ErrorResponse(BaseModel):
    error: str

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def validate_email(email: str) -> bool:
    """Validate email format"""
    return EMAIL_REGEX.match(email) is not None

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id: str) -> str:
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from JWT token"""
    token = credentials.credentials
    user_id = verify_token(token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@app.get("/", response_model=dict)
async def home():
    """Health check endpoint"""
    return {"message": "Auth API is running!"}

@app.post("/signup", response_model=TokenResponse, responses={400: {"model": ErrorResponse}, 409: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def signup(user_data: UserSignup):
    """Create a new user account"""
    try:
        email = user_data.email.strip().lower()
        password = user_data.password
        
        # Validate email format
        if not validate_email(email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )
        
        # Validate password length
        if len(password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters long"
            )
        
        # Check if user already exists
        if db.users.find_one({"email": email}):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        
        # Hash password
        hashed_password = hash_password(password)
        
        # Create user document
        user_doc = {
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert user into database
        result = db.users.insert_one(user_doc)
        user_id = result.inserted_id
        
        # Generate JWT token
        token = generate_token(user_id)
        
        return TokenResponse(
            message="User created successfully",
            token=token,
            user_id=str(user_id)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/login", response_model=TokenResponse, responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def login(user_data: UserLogin):
    """Authenticate user and get JWT token"""
    try:
        email = user_data.email.strip().lower()
        password = user_data.password
        
        # Find user by email
        user = db.users.find_one({"email": email})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(password, user['password']):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Generate JWT token
        token = generate_token(user['_id'])
        
        return TokenResponse(
            message="Login successful",
            token=token,
            user_id=str(user['_id'])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/profile", response_model=UserProfile, responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile information (requires authentication)"""
    try:
        return UserProfile(
            user_id=str(current_user['_id']),
            email=current_user['email'],
            created_at=current_user['created_at'].isoformat()
        )
        
    except Exception as e:
        print(f"Profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/verify-token", response_model=dict, responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def verify_token_endpoint(token_data: TokenVerify):
    """Verify if a JWT token is valid"""
    try:
        user_id = verify_token(token_data.token)
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        return {
            "valid": True,
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)