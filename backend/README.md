# FastAPI Authentication Module

A modern, high-performance authentication system built with FastAPI and MongoDB integration.

## Features

- ⚡ **FastAPI**: High-performance async framework
- 📚 **Auto Documentation**: Interactive API docs at `/docs`
- 🔐 **JWT Authentication**: Secure token-based auth
- 🗄️ **MongoDB**: Scalable database integration
- ✅ **Type Safety**: Full Pydantic model validation
- 🚀 **Async Support**: Non-blocking operations

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

The server will start on `http://localhost:5002`

3. Access interactive documentation:
- **Swagger UI**: `http://localhost:5002/docs`
- **ReDoc**: `http://localhost:5002/redoc`

## API Endpoints

### 1. Signup
**POST** `/signup`

Create a new user account.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "message": "User created successfully",
    "token": "jwt_token_here",
    "user_id": "user_id_here"
}
```

### 2. Login
**POST** `/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response:**
```json
{
    "message": "Login successful",
    "token": "jwt_token_here",
    "user_id": "user_id_here"
}
```

### 3. Get Profile
**GET** `/profile`

Get user profile information (requires authentication).

**Headers:**
```
Authorization: Bearer your_jwt_token_here
```

**Response:**
```json
{
    "user_id": "user_id_here",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00.000000"
}
```

### 4. Verify Token
**POST** `/verify-token`

Verify if a JWT token is valid.

**Request Body:**
```json
{
    "token": "jwt_token_here"
}
```

**Response:**
```json
{
    "valid": true,
    "user_id": "user_id_here"
}
```

## Key Features

- ✅ **User Registration** with email validation
- ✅ **Secure Password Hashing** using bcrypt
- ✅ **JWT Token Authentication** with 7-day expiration
- ✅ **Password Strength Validation** (minimum 6 characters)
- ✅ **Email Format Validation** with regex
- ✅ **CORS Enabled** for frontend integration
- ✅ **Comprehensive Error Handling** with proper HTTP status codes
- ✅ **MongoDB Integration** with SSL support
- ✅ **Automatic API Documentation** with Swagger UI
- ✅ **Type Safety** with Pydantic models
- ✅ **Async/Await Support** for better performance

## Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Email addresses are stored in lowercase
- Input validation prevents common attacks
- CORS is enabled for cross-origin requests

## Environment Variables

Make sure your `.env` file contains:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_secret_key_for_jwt
```
