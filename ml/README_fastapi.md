# Market Analysis Agent - FastAPI Implementation

A dynamic FastAPI application that provides AI-powered social media campaign planning with real-time research capabilities.

## Features

- 🤖 **AI-Powered Campaign Planning**: Uses Gemini 2.0 Flash model for intelligent campaign strategy generation
- 🔍 **Real-Time Research**: Integrates ExaTools and FirecrawlTools for comprehensive market research
- 📊 **Structured Data Models**: Pydantic models for request/response validation
- 🚀 **RESTful API**: Clean, documented API endpoints
- ⚡ **Async Processing**: Background task support for long-running operations
- 📚 **Auto Documentation**: Interactive API docs with Swagger UI
- 🔒 **Error Handling**: Comprehensive error handling and validation

## API Endpoints

### Core Endpoints

- `GET /` - API information and status
- `GET /health` - Health check endpoint
- `POST /campaign/plan` - Create comprehensive campaign plan
- `POST /campaign/quick` - Quick campaign generation
- `POST /campaign/async` - Asynchronous campaign processing
- `GET /campaign/examples` - Get example campaign briefs
- `GET /agent/config` - Get agent configuration

### Request Models

#### CampaignRequest
```json
{
  "product": "Sustainable Coffee Brand",
  "target_audience": "Gen Z",
  "location": "Mumbai",
  "occasion": "World Environment Day",
  "budget_range": "medium",
  "campaign_goals": ["brand awareness", "engagement"],
  "additional_notes": "Focus on sustainability messaging"
}
```

#### QuickCampaignRequest
```json
{
  "brief": "Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day"
}
```

## Installation

1. **Install Dependencies**:
   ```bash
   pip install -r requirements_fastapi.txt
   ```

2. **Set Environment Variables**:
   Create a `.env` file in the `ml/` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   EXA_API_KEY=your_exa_api_key_here
   ```

3. **Run the Server**:
   ```bash
   python run_server.py
   ```

   Or directly with uvicorn:
   ```bash
   uvicorn fastapi_market_agent:app --host 0.0.0.0 --port 8000 --reload
   ```

## Usage Examples

### 1. Comprehensive Campaign Planning

```python
import requests

# Create a detailed campaign plan
response = requests.post("http://localhost:8000/campaign/plan", json={
    "product": "Eco-Friendly Fashion Brand",
    "target_audience": "Millennial Women",
    "location": "Delhi",
    "occasion": "Diwali Season",
    "budget_range": "high",
    "campaign_goals": ["brand awareness", "sales", "engagement"],
    "additional_notes": "Focus on sustainable fashion and cultural celebration"
})

campaign_data = response.json()
print(campaign_data["strategy_plan"])
```

### 2. Quick Campaign Generation

```python
# Quick campaign from brief
response = requests.post("http://localhost:8000/campaign/quick", json={
    "brief": "Create a social media campaign for a fitness app targeting working professionals in Bangalore during New Year resolution season"
})

quick_campaign = response.json()
print(quick_campaign["strategy_plan"])
```

### 3. Get Campaign Examples

```python
# Get example campaigns
response = requests.get("http://localhost:8000/campaign/examples")
examples = response.json()
print(examples["examples"])
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## Response Format

All campaign endpoints return a `CampaignResponse` object:

```json
{
  "campaign_brief": "Generated campaign brief",
  "strategy_plan": "Detailed markdown strategy plan",
  "research_summary": "Summary of research conducted",
  "sources": ["ExaTools research", "FirecrawlTools scraping"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Handling

The API includes comprehensive error handling:

- **503 Service Unavailable**: When the agent is not initialized
- **500 Internal Server Error**: When campaign generation fails
- **422 Validation Error**: When request data is invalid

## Background Processing

For long-running campaign generation, use the async endpoint:

```python
# Start background processing
response = requests.post("http://localhost:8000/campaign/async", json={
    "brief": "Complex campaign brief..."
})

task_info = response.json()
print(f"Task ID: {task_info['task_id']}")
```

## Development

### Project Structure
```
ml/
├── fastapi_market_agent.py    # Main FastAPI application
├── market_analysis_agent.py   # Original agent implementation
├── run_server.py             # Server startup script
├── requirements_fastapi.txt   # FastAPI dependencies
└── README.md                 # This file
```

### Key Components

1. **Agent Initialization**: Uses lifespan events to initialize the agent on startup
2. **Request Validation**: Pydantic models ensure data integrity
3. **Error Handling**: Comprehensive error handling with meaningful messages
4. **CORS Support**: Enabled for frontend integration
5. **Background Tasks**: Support for async processing

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `EXA_API_KEY` | Exa API key for research | Yes |

## Dependencies

- **FastAPI**: Modern web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **Pydantic**: Data validation using Python type annotations
- **Agno**: AI agent framework
- **ExaTools**: Web search and research tools
- **FirecrawlTools**: Web scraping capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
