#!/usr/bin/env python3
"""
Startup script for Market Analysis Agent FastAPI server
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Check for required environment variables
    required_vars = ["GEMINI_API_KEY", "EXA_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your .env file")
        exit(1)
    
    print("🚀 Starting Market Analysis Agent FastAPI server...")
    print("📚 API Documentation available at: http://localhost:8000/docs")
    print("🔍 Health check available at: http://localhost:8000/health")
    
    uvicorn.run(
        "fastapi_market_agent:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
