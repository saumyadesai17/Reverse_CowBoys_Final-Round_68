from flask import Flask, request, jsonify
from flask_cors import CORS
from bson import ObjectId
import bcrypt
import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import re
from pymongo import MongoClient

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB configuration
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client.auth_db

# Test MongoDB connection on startup
try:
    # Test the connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    print(f"Database: {db.name}")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("Please check your MongoDB URI and network connection")

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def validate_email(email):
    """Validate email format"""
    return EMAIL_REGEX.match(email) is not None

def hash_password(password):
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def generate_token(user_id):
    """Generate JWT token for user"""
    payload = {
        'user_id': str(user_id),
        'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

@app.route('/')
def home():
    return jsonify({"message": "Auth API is running!"})

@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validate email format
        if not validate_email(email):
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
        # Check if user already exists
        if db.users.find_one({"email": email}):
            return jsonify({"error": "User with this email already exists"}), 409
        
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
        
        return jsonify({
            "message": "User created successfully",
            "token": token,
            "user_id": str(user_id)
        }), 201
        
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        # Find user by email
        user = db.users.find_one({"email": email})
        
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Verify password
        if not verify_password(password, user['password']):
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Generate JWT token
        token = generate_token(user['_id'])
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "user_id": str(user['_id'])
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route('/profile', methods=['GET'])
def get_profile():
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token required"}), 401
        
        token = auth_header.split(' ')[1]
        user_id = verify_token(token)
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        # Find user by ID
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Return user profile (without password)
        return jsonify({
            "user_id": str(user['_id']),
            "email": user['email'],
            "created_at": user['created_at'].isoformat()
        }), 200
        
    except Exception as e:
        print(f"Profile error: {e}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/verify-token', methods=['POST'])
def verify_token_endpoint():
    try:
        data = request.get_json()
        
        if not data or not data.get('token'):
            return jsonify({"error": "Token is required"}), 400
        
        user_id = verify_token(data['token'])
        
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401
        
        return jsonify({
            "valid": True,
            "user_id": user_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)
