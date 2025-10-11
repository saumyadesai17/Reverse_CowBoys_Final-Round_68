# Authentication Module

A simple Flask-based authentication system with MongoDB integration.

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

## Features

- ✅ User registration with email validation
- ✅ Secure password hashing using bcrypt
- ✅ JWT token-based authentication
- ✅ Password strength validation (minimum 6 characters)
- ✅ Email format validation
- ✅ CORS enabled for frontend integration
- ✅ Error handling and validation
- ✅ MongoDB integration

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
