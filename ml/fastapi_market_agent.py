"""
FastAPI Market Analysis Agent
Dynamic API for social media campaign planning with real-time research

Install dependencies:
pip install fastapi uvicorn openai exa-py agno firecrawl python-dotenv pydantic
"""

from datetime import datetime, timedelta
from textwrap import dedent
from typing import Optional, List, Dict, Any, Union
import os
import asyncio
import json
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.exa import ExaTools
from agno.tools.firecrawl import FirecrawlTools
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")
os.environ["EXA_API_KEY"] = os.getenv("EXA_API_KEY")

# Global agent instance
agent = None

def calculate_start_date(days: int) -> str:
    """Calculate start date based on number of days."""
    start_date = datetime.now() - timedelta(days=days)
    return start_date.strftime("%Y-%m-%d")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the agent on startup"""
    global agent
    try:
        agent = Agent(
            model=Gemini(id="gemini-2.0-flash"),
            tools=[
                ExaTools(start_published_date=calculate_start_date(30), type="keyword"),
                FirecrawlTools(),
            ],
            description=dedent("""\
                You are an expert social media campaign planner. You MUST use the available tools extensively to gather real data.
                You excel at:
                1. Using ExaTools to research market trends, competitor strategies, and audience insights
                2. Using FirecrawlTools to get detailed information from relevant marketing sources
                3. Creating data-driven campaign strategies based on real research
                4. Formulating creative concepts and strategic recommendations
                
                IMPORTANT: Always base your recommendations on actual data gathered from tool calls, not assumptions.
            """),
            instructions=[
                "You MUST use tools extensively for comprehensive research. Follow this process:",
                "1. Use ExaTools to search for '[product] marketing trends 2025'",
                "2. Use ExaTools to search for '[target audience] social media behavior [location]'", 
                "3. Use ExaTools to search for '[occasion] marketing campaigns successful'",
                "4. Use ExaTools to search for '[product category] competitors [location]'",
                "5. Use ExaTools to search for 'social media advertising costs [location] 2025'",
                "6. If any search returns limited results, use FirecrawlTools to scrape the most relevant pages",
                "7. Base ALL your recommendations (budget, timing, strategy) on the research data you gather",
                "8. Create strategic concepts and taglines inspired by successful examples from your research",
                "9. Always cite your sources and explain how tool data influenced your recommendations",
            ],
            expected_output=dedent("""\
            # Social Media Campaign Strategy Plan

            ## Research Summary
            {Overview of tool-based research conducted and key findings}

            ## Target Audience Analysis
            - Demographics: {based on research data}
            - Behavior patterns: {from social media research}
            - Platform preferences: {from tool findings}

            ## Market Intelligence
            - Industry trends: {from tool research}
            - Competitor insights: {from search results}
            - Market opportunities: {identified through research}

            ## Campaign Strategy
            - Core concept: {creative theme/tagline}
            - Key messaging: {strategic messages}
            - Platform approach: {based on research}

            ## Budget & Timeline Recommendations  
            - Budget insights: {based on cost research}
            - Timeline strategy: {informed by occasion research}
            - Success metrics: {industry benchmarks from research}

            ## Sources & References
            {List all tool searches and scraped sources used}
            """),
            markdown=True
        )
        print("✅ Market Analysis Agent initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        raise
    yield
    print("🔄 Shutting down Market Analysis Agent")

# Initialize FastAPI app
app = FastAPI(
    title="Market Analysis Agent API",
    description="Dynamic API for social media campaign planning with real-time research",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models for Module Configurations

class AgeRange(BaseModel):
    min: Optional[int] = Field(None, description="Minimum age")
    max: Optional[int] = Field(None, description="Maximum age")

class TargetAudience(BaseModel):
    age_range: Optional[AgeRange] = Field(None, description="Age range of target audience")
    locations: Optional[List[str]] = Field(None, description="Geographic locations")
    interests: Optional[List[str]] = Field(None, description="Interests and hobbies")
    demographics: Optional[List[str]] = Field(None, description="Demographic characteristics")
    pain_points: Optional[List[str]] = Field(None, description="Pain points and challenges")

class ProductServiceDetails(BaseModel):
    name: Optional[str] = Field(None, description="Product or service name")
    category: Optional[str] = Field(None, description="Product category")
    features: Optional[List[str]] = Field(None, description="Key features")
    unique_selling_points: Optional[List[str]] = Field(None, description="Unique selling propositions")

class BudgetRange(BaseModel):
    min: Optional[float] = Field(None, description="Minimum budget")
    max: Optional[float] = Field(None, description="Maximum budget")

class BrandGuidelines(BaseModel):
    colors: Optional[List[str]] = Field(None, description="Brand colors")
    style: Optional[str] = Field(None, description="Visual style")
    logo_url: Optional[str] = Field(None, description="Logo URL")
    fonts: Optional[List[str]] = Field(None, description="Brand fonts")
    logo_usage_rules: Optional[str] = Field(None, description="Logo usage guidelines")
    tone_of_voice: Optional[str] = Field(None, description="Brand tone of voice")
    allowed_phrases: Optional[List[str]] = Field(None, description="Allowed phrases")
    restricted_phrases: Optional[List[str]] = Field(None, description="Restricted phrases")
    hashtag_rules: Optional[List[str]] = Field(None, description="Hashtag usage rules")
    tag_rules: Optional[List[str]] = Field(None, description="Tagging rules")

class Dimensions(BaseModel):
    width: Optional[int] = Field(None, description="Width in pixels")
    height: Optional[int] = Field(None, description="Height in pixels")

class PostingWindow(BaseModel):
    start_time: Optional[str] = Field(None, description="Start time for posting")
    end_time: Optional[str] = Field(None, description="End time for posting")

class DateRange(BaseModel):
    start_date: Optional[str] = Field(None, description="Start date")
    end_date: Optional[str] = Field(None, description="End date")

# Module Configuration Models
class CampaignStrategyGenerator(BaseModel):
    brand_name: Optional[str] = Field(None, description="Brand name")
    campaign_goal: Optional[str] = Field(None, description="Primary campaign goal")
    target_audience: Optional[TargetAudience] = Field(None, description="Target audience details")
    brand_voice: Optional[str] = Field(None, description="Brand voice and tone")
    product_or_service_details: Optional[ProductServiceDetails] = Field(None, description="Product/service information")
    competitor_brands: Optional[List[str]] = Field(None, description="Competitor brands")
    marketing_channels: Optional[List[str]] = Field(None, description="Marketing channels")
    season_or_event_context: Optional[str] = Field(None, description="Seasonal or event context")
    budget_range: Optional[BudgetRange] = Field(None, description="Budget range")
    duration_days: Optional[int] = Field(None, description="Campaign duration in days")

class CopywritingAgent(BaseModel):
    campaign_brief: Optional[str] = Field(None, description="Campaign brief")
    content_type: Optional[str] = Field(None, description="Type of content")
    tone_of_voice: Optional[str] = Field(None, description="Tone of voice")
    language: Optional[str] = Field(None, description="Language")
    keywords: Optional[List[str]] = Field(None, description="Keywords")
    call_to_action: Optional[str] = Field(None, description="Call to action")
    platform: Optional[str] = Field(None, description="Target platform")
    word_limit: Optional[int] = Field(None, description="Word limit")
    audience_profile: Optional[TargetAudience] = Field(None, description="Audience profile")
    brand_guidelines: Optional[BrandGuidelines] = Field(None, description="Brand guidelines")

class VisualAssetGenerator(BaseModel):
    prompt: Optional[str] = Field(None, description="Image generation prompt")
    brand_guidelines: Optional[BrandGuidelines] = Field(None, description="Brand guidelines")
    quantity: Optional[int] = Field(None, description="Number of images to generate")
    dimensions: Optional[Dimensions] = Field(None, description="Image dimensions")
    image_style: Optional[str] = Field(None, description="Image style")
    negative_prompts: Optional[List[str]] = Field(None, description="Negative prompts")
    reference_assets: Optional[List[str]] = Field(None, description="Reference assets")
    campaign_context: Optional[str] = Field(None, description="Campaign context")

class MediaPlanGenerator(BaseModel):
    campaign_objective: Optional[str] = Field(None, description="Campaign objective")
    target_audience: Optional[TargetAudience] = Field(None, description="Target audience")
    budget: Optional[float] = Field(None, description="Total budget")
    duration_days: Optional[int] = Field(None, description="Campaign duration")
    preferred_platforms: Optional[List[str]] = Field(None, description="Preferred platforms")
    historical_performance_data: Optional[List[Dict[str, Any]]] = Field(None, description="Historical performance data")
    content_types: Optional[List[str]] = Field(None, description="Content types")
    posting_frequency: Optional[str] = Field(None, description="Posting frequency")

class SocialPostScheduler(BaseModel):
    content_assets: Optional[List[str]] = Field(None, description="Content assets")
    captions: Optional[List[str]] = Field(None, description="Post captions")
    target_platforms: Optional[List[str]] = Field(None, description="Target platforms")
    timezones: Optional[List[str]] = Field(None, description="Timezones")
    posting_window: Optional[PostingWindow] = Field(None, description="Posting window")
    schedule_strategy: Optional[str] = Field(None, description="Schedule strategy")
    preferred_posting_days: Optional[List[str]] = Field(None, description="Preferred posting days")
    brand_guidelines: Optional[BrandGuidelines] = Field(None, description="Brand guidelines")

class AdBudgetOptimizer(BaseModel):
    campaign_objective: Optional[str] = Field(None, description="Campaign objective")
    total_budget: Optional[float] = Field(None, description="Total budget")
    platform_metrics: Optional[List[Dict[str, Any]]] = Field(None, description="Platform metrics")
    historical_performance: Optional[List[Dict[str, Any]]] = Field(None, description="Historical performance")
    target_audience: Optional[TargetAudience] = Field(None, description="Target audience")
    optimization_goal: Optional[str] = Field(None, description="Optimization goal")
    time_horizon_days: Optional[int] = Field(None, description="Time horizon")

class PerformanceAnalyticsAgent(BaseModel):
    campaign_id: Optional[str] = Field(None, description="Campaign ID")
    metrics: Optional[List[str]] = Field(None, description="Metrics to track")
    platforms: Optional[List[str]] = Field(None, description="Platforms")
    date_range: Optional[DateRange] = Field(None, description="Date range")
    data_sources: Optional[List[str]] = Field(None, description="Data sources")
    aggregation_level: Optional[str] = Field(None, description="Aggregation level")
    compare_with_previous_period: Optional[bool] = Field(None, description="Compare with previous period")

class SentimentAnalysisAgent(BaseModel):
    social_comments: Optional[List[str]] = Field(None, description="Social comments")
    brand_mentions: Optional[List[str]] = Field(None, description="Brand mentions")
    language: Optional[str] = Field(None, description="Language")
    platform: Optional[str] = Field(None, description="Platform")
    date_range: Optional[DateRange] = Field(None, description="Date range")
    sentiment_categories: Optional[List[str]] = Field(None, description="Sentiment categories")
    include_neutral: Optional[bool] = Field(None, description="Include neutral sentiment")
    keywords_to_track: Optional[List[str]] = Field(None, description="Keywords to track")

class Thresholds(BaseModel):
    engagement_rate: Optional[float] = Field(None, description="Engagement rate threshold")
    conversion_rate: Optional[float] = Field(None, description="Conversion rate threshold")
    sentiment_score: Optional[float] = Field(None, description="Sentiment score threshold")

class CampaignSupervisor(BaseModel):
    campaign_plan: Optional[Dict[str, Any]] = Field(None, description="Campaign plan")
    submodule_outputs: Optional[List[Dict[str, Any]]] = Field(None, description="Submodule outputs")
    performance_metrics: Optional[List[Dict[str, Any]]] = Field(None, description="Performance metrics")
    thresholds: Optional[Thresholds] = Field(None, description="Performance thresholds")
    override_instructions: Optional[List[str]] = Field(None, description="Override instructions")
    alert_preferences: Optional[str] = Field(None, description="Alert preferences")

class AssetReviewAgent(BaseModel):
    asset_urls: Optional[List[str]] = Field(None, description="Asset URLs")
    brand_guidelines: Optional[BrandGuidelines] = Field(None, description="Brand guidelines")
    compliance_rules: Optional[List[str]] = Field(None, description="Compliance rules")
    platform_standards: Optional[List[str]] = Field(None, description="Platform standards")
    review_criteria: Optional[List[str]] = Field(None, description="Review criteria")
    manual_review_notes: Optional[str] = Field(None, description="Manual review notes")

class TrendAnalysisAgent(BaseModel):
    industry_keywords: Optional[List[str]] = Field(None, description="Industry keywords")
    platforms: Optional[List[str]] = Field(None, description="Platforms")
    region: Optional[str] = Field(None, description="Region")
    time_window_days: Optional[int] = Field(None, description="Time window in days")
    data_sources: Optional[List[str]] = Field(None, description="Data sources")
    sentiment_tracking: Optional[bool] = Field(None, description="Sentiment tracking")
    competitor_handles: Optional[List[str]] = Field(None, description="Competitor handles")
    output_format: Optional[str] = Field(None, description="Output format")

class ModuleConfigurations(BaseModel):
    """Container for all module configurations"""
    campaign_strategy_generator: Optional[CampaignStrategyGenerator] = Field(None, description="Campaign strategy generator config")
    copywriting_agent: Optional[CopywritingAgent] = Field(None, description="Copywriting agent config")
    visual_asset_generator: Optional[VisualAssetGenerator] = Field(None, description="Visual asset generator config")
    media_plan_generator: Optional[MediaPlanGenerator] = Field(None, description="Media plan generator config")
    social_post_scheduler: Optional[SocialPostScheduler] = Field(None, description="Social post scheduler config")
    ad_budget_optimizer: Optional[AdBudgetOptimizer] = Field(None, description="Ad budget optimizer config")
    performance_analytics_agent: Optional[PerformanceAnalyticsAgent] = Field(None, description="Performance analytics agent config")
    sentiment_analysis_agent: Optional[SentimentAnalysisAgent] = Field(None, description="Sentiment analysis agent config")
    campaign_supervisor: Optional[CampaignSupervisor] = Field(None, description="Campaign supervisor config")
    asset_review_agent: Optional[AssetReviewAgent] = Field(None, description="Asset review agent config")
    trend_analysis_agent: Optional[TrendAnalysisAgent] = Field(None, description="Trend analysis agent config")

# Original Models
class CampaignRequest(BaseModel):
    """Request model for campaign planning"""
    product: str = Field(..., description="Product or service name")
    target_audience: str = Field(..., description="Target audience demographics")
    location: str = Field(..., description="Geographic location for the campaign")
    occasion: Optional[str] = Field(None, description="Special occasion or season")
    budget_range: Optional[str] = Field(None, description="Budget range (e.g., 'low', 'medium', 'high')")
    campaign_goals: Optional[List[str]] = Field(None, description="Specific campaign goals")
    additional_notes: Optional[str] = Field(None, description="Additional requirements or notes")

class CampaignResponse(BaseModel):
    """Response model for campaign strategy"""
    campaign_brief: str = Field(..., description="Generated campaign brief")
    strategy_plan: str = Field(..., description="Detailed strategy plan")
    research_summary: str = Field(..., description="Summary of research conducted")
    sources: List[str] = Field(..., description="List of sources used")
    module_configurations: Optional[ModuleConfigurations] = Field(None, description="Prefilled module configurations")
    timestamp: datetime = Field(default_factory=datetime.now)

class QuickCampaignRequest(BaseModel):
    """Simplified request for quick campaign generation"""
    brief: str = Field(..., description="Brief description of the campaign")

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    agent_ready: bool
    timestamp: datetime

def extract_module_configurations(campaign_brief: str, agent: Agent) -> ModuleConfigurations:
    """Extract and infer module configurations from campaign brief using LLM"""
    
    # Create comprehensive extraction prompt
    extraction_prompt = f"""
    Analyze the following campaign brief and extract/infer ALL possible fields for each module configuration.
    Only extract fields that can be reasonably inferred from the text or through logical deduction.
    If a field cannot be determined, leave it null but keep the field name.
    
    Campaign Brief: "{campaign_brief}"
    
    Please extract information for ALL modules and return as a comprehensive JSON object with this exact structure:
    
    {{
        "campaign_strategy_generator": {{
            "brand_name": "inferred brand name or null",
            "campaign_goal": "inferred campaign goal or null",
            "target_audience": {{
                "age_range": {{"min": inferred_min_age, "max": inferred_max_age}},
                "locations": ["inferred locations"],
                "interests": ["inferred interests"],
                "demographics": ["inferred demographics"]
            }},
            "brand_voice": "inferred brand voice or null",
            "product_or_service_details": {{
                "name": "inferred product name or null",
                "category": "inferred category or null",
                "features": ["inferred features"],
                "unique_selling_points": ["inferred USPs"]
            }},
            "competitor_brands": ["inferred competitors"],
            "marketing_channels": ["inferred channels"],
            "season_or_event_context": "inferred season/event or null",
            "budget_range": {{"min": inferred_min_budget, "max": inferred_max_budget}},
            "duration_days": inferred_duration_days
        }},
        "copywriting_agent": {{
            "campaign_brief": "{campaign_brief}",
            "content_type": "inferred content type or null",
            "tone_of_voice": "inferred tone or null",
            "language": "inferred language or null",
            "keywords": ["inferred keywords"],
            "call_to_action": "inferred CTA or null",
            "platform": "inferred platform or null",
            "word_limit": inferred_word_limit,
            "audience_profile": {{
                "age_range": {{"min": inferred_min_age, "max": inferred_max_age}},
                "interests": ["inferred interests"],
                "pain_points": ["inferred pain points"]
            }},
            "brand_guidelines": {{
                "colors": ["inferred colors"],
                "style": "inferred style or null",
                "tone_of_voice": "inferred tone or null",
                "allowed_phrases": ["inferred allowed phrases"],
                "restricted_phrases": ["inferred restricted phrases"]
            }}
        }},
        "visual_asset_generator": {{
            "prompt": "generated visual prompt based on brief",
            "brand_guidelines": {{
                "colors": ["inferred colors"],
                "style": "inferred style or null"
            }},
            "quantity": inferred_quantity,
            "dimensions": {{"width": inferred_width, "height": inferred_height}},
            "image_style": "inferred image style or null",
            "negative_prompts": ["inferred negative prompts"],
            "campaign_context": "{campaign_brief}"
        }},
        "media_plan_generator": {{
            "campaign_objective": "inferred objective or null",
            "target_audience": {{
                "age_range": {{"min": inferred_min_age, "max": inferred_max_age}},
                "locations": ["inferred locations"],
                "interests": ["inferred interests"]
            }},
            "budget": inferred_budget,
            "duration_days": inferred_duration_days,
            "preferred_platforms": ["inferred platforms"],
            "content_types": ["inferred content types"],
            "posting_frequency": "inferred frequency or null"
        }},
        "social_post_scheduler": {{
            "target_platforms": ["inferred platforms"],
            "timezones": ["inferred timezones"],
            "posting_window": {{"start_time": "inferred start time", "end_time": "inferred end time"}},
            "schedule_strategy": "inferred strategy or null",
            "preferred_posting_days": ["inferred posting days"],
            "brand_guidelines": {{
                "hashtag_rules": ["inferred hashtag rules"],
                "tag_rules": ["inferred tag rules"]
            }}
        }},
        "ad_budget_optimizer": {{
            "campaign_objective": "inferred objective or null",
            "total_budget": inferred_budget,
            "target_audience": {{
                "locations": ["inferred locations"],
                "interests": ["inferred interests"]
            }},
            "optimization_goal": "inferred goal or null",
            "time_horizon_days": inferred_duration_days
        }},
        "performance_analytics_agent": {{
            "metrics": ["inferred metrics"],
            "platforms": ["inferred platforms"],
            "date_range": {{"start_date": "inferred start date", "end_date": "inferred end date"}},
            "data_sources": ["inferred data sources"],
            "aggregation_level": "inferred level or null",
            "compare_with_previous_period": inferred_boolean
        }},
        "sentiment_analysis_agent": {{
            "language": "inferred language or null",
            "platform": "inferred platform or null",
            "date_range": {{"start_date": "inferred start date", "end_date": "inferred end date"}},
            "sentiment_categories": ["inferred categories"],
            "include_neutral": inferred_boolean,
            "keywords_to_track": ["inferred keywords"]
        }},
        "campaign_supervisor": {{
            "thresholds": {{
                "engagement_rate": inferred_rate,
                "conversion_rate": inferred_rate,
                "sentiment_score": inferred_score
            }},
            "alert_preferences": "inferred preferences or null"
        }},
        "asset_review_agent": {{
            "brand_guidelines": {{
                "colors": ["inferred colors"],
                "fonts": ["inferred fonts"],
                "logo_usage_rules": "inferred rules or null",
                "tone_of_voice": "inferred tone or null"
            }},
            "compliance_rules": ["inferred compliance rules"],
            "platform_standards": ["inferred platform standards"],
            "review_criteria": ["inferred review criteria"]
        }},
        "trend_analysis_agent": {{
            "industry_keywords": ["inferred industry keywords"],
            "platforms": ["inferred platforms"],
            "region": "inferred region or null",
            "time_window_days": inferred_duration_days,
            "data_sources": ["inferred data sources"],
            "sentiment_tracking": inferred_boolean,
            "competitor_handles": ["inferred competitor handles"],
            "output_format": "inferred format or null"
        }}
    }}
    
    IMPORTANT RULES:
    1. Be conservative - only include fields that are clearly mentioned or can be reasonably inferred
    2. Use your knowledge to make intelligent inferences (e.g., if targeting "Gen Z", infer age range 18-26)
    3. If location is mentioned, infer relevant timezone
    4. If budget is mentioned as "medium", infer reasonable budget range
    5. If platform is mentioned, infer relevant dimensions and posting strategies
    6. Generate creative and relevant prompts for visual assets
    7. Always keep the exact JSON structure - use null for missing fields
    8. Make intelligent assumptions based on industry knowledge and best practices
    """
    
    try:
        # Get extraction response from agent
        extraction_response = agent.run(extraction_prompt)
        extraction_text = extraction_response.content if hasattr(extraction_response, 'content') else str(extraction_response)
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', extraction_text, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            extracted_data = json.loads(json_str)
            
            # Convert to ModuleConfigurations object
            return ModuleConfigurations(**extracted_data)
        else:
            print("Warning: Could not find JSON in extraction response")
            return ModuleConfigurations()
            
    except Exception as e:
        print(f"Error extracting module configurations: {e}")
        return ModuleConfigurations()

# Routes
@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Market Analysis Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        agent_ready=agent is not None,
        timestamp=datetime.now()
    )

@app.post("/campaign/plan", response_model=CampaignResponse)
async def create_campaign_plan(request: CampaignRequest):
    """
    Create a comprehensive social media campaign plan
    
    This endpoint generates a detailed campaign strategy based on:
    - Product/service information
    - Target audience demographics
    - Geographic location
    - Special occasions or seasons
    - Budget considerations
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        # Construct campaign brief from request
        campaign_brief = f"""
        Launch a social media campaign for {request.product} targeting {request.target_audience} in {request.location}
        """
        
        if request.occasion:
            campaign_brief += f" for {request.occasion}"
        
        if request.budget_range:
            campaign_brief += f" with a {request.budget_range} budget"
        
        if request.campaign_goals:
            goals_text = ", ".join(request.campaign_goals)
            campaign_brief += f". Campaign goals: {goals_text}"
        
        if request.additional_notes:
            campaign_brief += f". Additional requirements: {request.additional_notes}"
        
        # Generate comprehensive strategy plan using agent
        strategy_prompt = f"""
        Create a comprehensive social media campaign strategy plan based on this brief:
        "{campaign_brief}"
        
        Use the available tools extensively for comprehensive research. Follow this process:
        1. Use ExaTools to search for '[product] marketing trends 2025'
        2. Use ExaTools to search for '[target audience] social media behavior [location]' 
        3. Use ExaTools to search for '[occasion] marketing campaigns successful'
        4. Use ExaTools to search for '[product category] competitors [location]'
        5. Use ExaTools to search for 'social media advertising costs [location] 2025'
        6. If any search returns limited results, use FirecrawlTools to scrape the most relevant pages
        7. Base ALL your recommendations (budget, timing, strategy) on the research data you gather
        8. Create strategic concepts and taglines inspired by successful examples from your research
        9. Always cite your sources and explain how tool data influenced your recommendations
        
        Create a detailed strategy plan that includes:
        - Research Summary
        - Target Audience Analysis  
        - Market Intelligence
        - Campaign Strategy
        - Budget & Timeline Recommendations
        - Sources & References
        
        Base your recommendations on actual data gathered from tool calls, not assumptions.
        """
        
        response = agent.run(strategy_prompt)
        strategy_plan = response.content if hasattr(response, 'content') else str(response)
        
        # Extract module configurations using LLM
        module_configurations = extract_module_configurations(campaign_brief, agent)
        
        # Extract sources
        sources = ["ExaTools research", "FirecrawlTools scraping"]
        
        return CampaignResponse(
            campaign_brief=campaign_brief,
            strategy_plan=strategy_plan,
            research_summary="Research conducted using ExaTools and FirecrawlTools with comprehensive field extraction",
            sources=sources,
            module_configurations=module_configurations
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating campaign plan: {str(e)}")

@app.post("/campaign/quick", response_model=CampaignResponse)
async def create_quick_campaign(request: QuickCampaignRequest):
    """
    Create a comprehensive social media campaign plan from a brief description
    
    This endpoint generates:
    1. A detailed campaign strategy plan using real-time research
    2. Prefilled module configurations for all content generation modules
    3. Extracted and inferred fields based on the campaign brief
    
    The module configurations can be used directly for content generation workflows.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        # Generate comprehensive strategy plan using agent
        strategy_prompt = f"""
        Create a comprehensive social media campaign strategy plan based on this brief:
        "{request.brief}"
        
        Use the available tools extensively for comprehensive research. Follow this process:
        1. Use ExaTools to search for '[product] marketing trends 2025'
        2. Use ExaTools to search for '[target audience] social media behavior [location]' 
        3. Use ExaTools to search for '[occasion] marketing campaigns successful'
        4. Use ExaTools to search for '[product category] competitors [location]'
        5. Use ExaTools to search for 'social media advertising costs [location] 2025'
        6. If any search returns limited results, use FirecrawlTools to scrape the most relevant pages
        7. Base ALL your recommendations (budget, timing, strategy) on the research data you gather
        8. Create strategic concepts and taglines inspired by successful examples from your research
        9. Always cite your sources and explain how tool data influenced your recommendations
        
        Create a detailed strategy plan that includes:
        - Research Summary
        - Target Audience Analysis  
        - Market Intelligence
        - Campaign Strategy
        - Budget & Timeline Recommendations
        - Sources & References
        
        Base your recommendations on actual data gathered from tool calls, not assumptions.
        """
        
        response = agent.run(strategy_prompt)
        strategy_plan = response.content if hasattr(response, 'content') else str(response)
        
        # Extract module configurations using LLM
        module_configurations = extract_module_configurations(request.brief, agent)
        
        # Extract sources
        sources = ["ExaTools research", "FirecrawlTools scraping"]
        
        return CampaignResponse(
            campaign_brief=request.brief,
            strategy_plan=strategy_plan,
            research_summary="Research conducted using ExaTools and FirecrawlTools with comprehensive field extraction",
            sources=sources,
            module_configurations=module_configurations
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating quick campaign: {str(e)}")

@app.get("/campaign/examples")
async def get_campaign_examples():
    """Get example campaign briefs for inspiration"""
    return {
        "examples": [
            {
                "title": "Sustainable Coffee Brand",
                "brief": "Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day",
                "category": "Food & Beverage"
            },
            {
                "title": "Fitness App",
                "brief": "Create a social media campaign for a new fitness app targeting working professionals in Bangalore during New Year resolution season",
                "category": "Health & Fitness"
            },
            {
                "title": "Eco-Friendly Fashion",
                "brief": "Plan a social media campaign for an eco-friendly fashion brand targeting millennial women in Delhi for Diwali season",
                "category": "Fashion & Lifestyle"
            },
            {
                "title": "Tech Startup",
                "brief": "Design a social media campaign for a fintech startup targeting young professionals in Singapore for Q1 launch",
                "category": "Technology"
            }
        ]
    }

@app.get("/agent/config")
async def get_agent_config():
    """Get current agent configuration"""
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    return {
        "model": "gemini-2.0-flash",
        "tools": ["ExaTools", "FirecrawlTools"],
        "research_period_days": 30,
        "capabilities": [
            "Market trend analysis",
            "Competitor research",
            "Audience insights",
            "Campaign strategy development",
            "Budget recommendations",
            "Timeline planning"
        ]
    }

# Background task for async processing
async def process_campaign_async(campaign_brief: str) -> str:
    """Process campaign in background"""
    if not agent:
        raise Exception("Agent not initialized")
    
    response = agent.run(campaign_brief)
    return response.content if hasattr(response, 'content') else str(response)

@app.post("/campaign/async")
async def create_campaign_async(request: QuickCampaignRequest, background_tasks: BackgroundTasks):
    """
    Create a campaign plan asynchronously
    
    This endpoint starts the campaign generation process in the background
    and returns immediately with a task ID.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    task_id = f"campaign_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Add background task
    background_tasks.add_task(process_campaign_async, request.brief)
    
    return {
        "task_id": task_id,
        "status": "processing",
        "message": "Campaign generation started in background",
        "timestamp": datetime.now()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "fastapi_market_agent:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
