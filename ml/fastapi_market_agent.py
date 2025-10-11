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
import time
import hashlib
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.exa import ExaTools
from agno.tools.firecrawl import FirecrawlTools
from dotenv import load_dotenv
from image import visual_asset_manager
from audience_intelligence_analyzer import (
    AudienceIntelligenceRequest, 
    AudienceIntelligenceResponse,
    analyze_audience_intelligence
)

# Load environment variables
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")
os.environ["EXA_API_KEY"] = os.getenv("EXA_API_KEY")

# Global agent instance
agent = None

# Cache for API responses to reduce rate limiting
response_cache: Dict[str, Dict[str, Any]] = {}
CACHE_DURATION = 3600  # 1 hour cache

# Rate limit tracking
rate_limit_tracker = {
    "exa_last_reset": 0,
    "firecrawl_last_reset": 0,
    "exa_requests_count": 0,
    "firecrawl_requests_count": 0
}

def get_cache_key(prompt: str) -> str:
    """Generate cache key for prompt"""
    return hashlib.md5(prompt.encode()).hexdigest()

def is_cache_valid(cache_entry: Dict[str, Any]) -> bool:
    """Check if cache entry is still valid"""
    if not cache_entry:
        return False
    cache_time = cache_entry.get("timestamp", 0)
    return time.time() - cache_time < CACHE_DURATION

async def retry_with_backoff(func, max_retries: int = 3, base_delay: float = 1.0):
    """Retry function with exponential backoff"""
    for attempt in range(max_retries):
        try:
            return await func() if asyncio.iscoroutinefunction(func) else func()
        except Exception as e:
            if "429" in str(e) or "Too Many Requests" in str(e):
                if attempt < max_retries - 1:
                    delay = base_delay * (2 ** attempt)
                    print(f"Rate limited, retrying in {delay} seconds... (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(delay)
                    continue
            raise e
    raise Exception("Max retries exceeded")

def check_rate_limits() -> Dict[str, bool]:
    """Check if we're within rate limits"""
    current_time = time.time()
    
    # Reset counters every hour
    if current_time - rate_limit_tracker["exa_last_reset"] > 3600:
        rate_limit_tracker["exa_requests_count"] = 0
        rate_limit_tracker["exa_last_reset"] = current_time
    
    if current_time - rate_limit_tracker["firecrawl_last_reset"] > 3600:
        rate_limit_tracker["firecrawl_requests_count"] = 0
        rate_limit_tracker["firecrawl_last_reset"] = current_time
    
    # Conservative limits (adjust based on your API quotas)
    exa_limit = 50  # requests per hour
    firecrawl_limit = 100  # requests per hour
    
    return {
        "exa_available": rate_limit_tracker["exa_requests_count"] < exa_limit,
        "firecrawl_available": rate_limit_tracker["firecrawl_requests_count"] < firecrawl_limit
    }

def calculate_start_date(days: int) -> str:
    """Calculate start date based on number of days."""
    start_date = datetime.now() - timedelta(days=days)
    return start_date.strftime("%Y-%m-%d")

# Pydantic Models for Module Configurations
class BrandGuidelines(BaseModel):
    colors: Optional[List[str]] = Field(None, description="Brand colors")
    style: Optional[str] = Field(None, description="Visual style")
    logo_url: Optional[str] = Field(None, description="Logo URL")

class Dimensions(BaseModel):
    width: Optional[int] = Field(None, description="Width in pixels")
    height: Optional[int] = Field(None, description="Height in pixels")

class BackgroundMusic(BaseModel):
    music_style: Optional[str] = Field(None, description="Music style")
    volume: Optional[float] = Field(None, description="Volume level")

class Voiceover(BaseModel):
    voice_type: Optional[str] = Field(None, description="Voice type")
    language: Optional[str] = Field(None, description="Language")

class TargetAudience(BaseModel):
    product_description: Optional[str] = Field(None, description="Product description")
    demographics: Optional[str] = Field(None, description="Demographics")
    psychographics: Optional[str] = Field(None, description="Psychographics")
    pain_points: Optional[List[str]] = Field(None, description="Pain points")

class WordCountRange(BaseModel):
    min: Optional[int] = Field(None, description="Minimum word count")
    max: Optional[int] = Field(None, description="Maximum word count")

class GeographicLocation(BaseModel):
    country: Optional[str] = Field(None, description="Country")
    city: Optional[str] = Field(None, description="City")
    region: Optional[str] = Field(None, description="Region")

class ExistingCustomerData(BaseModel):
    age_range: Optional[str] = Field(None, description="Age range")
    interests: Optional[List[str]] = Field(None, description="Interests")
    behavior_patterns: Optional[List[str]] = Field(None, description="Behavior patterns")

class CampaignDuration(BaseModel):
    start_date: Optional[str] = Field(None, description="Start date")
    end_date: Optional[str] = Field(None, description="End date")

class ContentInventory(BaseModel):
    content_id: Optional[str] = Field(None, description="Content ID")
    content_type: Optional[str] = Field(None, description="Content type")
    platform: Optional[str] = Field(None, description="Platform")

class OptimalPostingTimes(BaseModel):
    platform: Optional[str] = Field(None, description="Platform")
    time_slots: Optional[List[str]] = Field(None, description="Time slots")

class PostingFrequency(BaseModel):
    min_posts_per_day: Optional[int] = Field(None, description="Minimum posts per day")
    max_posts_per_day: Optional[int] = Field(None, description="Maximum posts per day")

class KeyDate(BaseModel):
    date: Optional[str] = Field(None, description="Date")
    event: Optional[str] = Field(None, description="Event")
    priority: Optional[List[str]] = Field(None, description="Priority level")

class TimelineSlot(BaseModel):
    timeline_slot_id: Optional[str] = Field(None, description="Timeline slot ID")
    scheduled_date: Optional[str] = Field(None, description="Scheduled date")
    content_type: Optional[str] = Field(None, description="Content type")
    platform: Optional[str] = Field(None, description="Platform")
    target_segment: Optional[str] = Field(None, description="Target segment")
    priority: Optional[List[str]] = Field(None, description="Priority")

class GeneratedCopy(BaseModel):
    copy_text: Optional[str] = Field(None, description="Copy text")
    copy_id: Optional[str] = Field(None, description="Copy ID")
    word_count: Optional[int] = Field(None, description="Word count")
    hashtags: Optional[List[str]] = Field(None, description="Hashtags")
    emojis: Optional[List[str]] = Field(None, description="Emojis")

class GeneratedImage(BaseModel):
    image_url: Optional[str] = Field(None, description="Image URL")
    image_id: Optional[str] = Field(None, description="Image ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Metadata")

class PlatformSpecifications(BaseModel):
    platform_name: Optional[str] = Field(None, description="Platform name")
    max_caption_length: Optional[int] = Field(None, description="Max caption length")
    supported_formats: Optional[List[str]] = Field(None, description="Supported formats")
    aspect_ratio_requirements: Optional[str] = Field(None, description="Aspect ratio requirements")

class ContentPackage(BaseModel):
    copy_id: Optional[str] = Field(None, description="Copy ID")
    copy_text: Optional[str] = Field(None, description="Copy text")
    asset_ids: Optional[List[str]] = Field(None, description="Asset IDs")
    asset_urls: Optional[List[str]] = Field(None, description="Asset URLs")

class PostingParameters(BaseModel):
    hashtags: Optional[List[str]] = Field(None, description="Hashtags")
    mentions: Optional[List[str]] = Field(None, description="Mentions")
    location_tag: Optional[str] = Field(None, description="Location tag")

class ScheduleItem(BaseModel):
    schedule_item_id: Optional[str] = Field(None, description="Schedule item ID")
    scheduled_datetime: Optional[str] = Field(None, description="Scheduled datetime")
    platform: Optional[str] = Field(None, description="Platform")
    content_package: Optional[ContentPackage] = Field(None, description="Content package")
    posting_parameters: Optional[PostingParameters] = Field(None, description="Posting parameters")
    target_segment: Optional[str] = Field(None, description="Target segment")

class PlatformCredentials(BaseModel):
    platform_name: Optional[str] = Field(None, description="Platform name")
    auth_token: Optional[str] = Field(None, description="Auth token")
    account_id: Optional[str] = Field(None, description="Account ID")

class ContactInfo(BaseModel):
    name: Optional[str] = Field(None, description="Name")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Phone")
    company: Optional[str] = Field(None, description="Company")
    job_title: Optional[str] = Field(None, description="Job title")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn URL")

class DiscoveredLead(BaseModel):
    lead_id: Optional[str] = Field(None, description="Lead ID")
    contact_info: Optional[ContactInfo] = Field(None, description="Contact info")

class CallWindowPreferences(BaseModel):
    timezone: Optional[str] = Field(None, description="Timezone")
    preferred_hours: Optional[List[str]] = Field(None, description="Preferred hours")
    avoid_dates: Optional[List[str]] = Field(None, description="Avoid dates")

class PrioritizationCriteria(BaseModel):
    qualification_score_threshold: Optional[float] = Field(None, description="Qualification score threshold")
    priority_segments: Optional[List[str]] = Field(None, description="Priority segments")

class CallSchedule(BaseModel):
    schedule_id: Optional[str] = Field(None, description="Schedule ID")
    lead_id: Optional[str] = Field(None, description="Lead ID")
    scheduled_datetime: Optional[str] = Field(None, description="Scheduled datetime")
    call_objective: Optional[List[str]] = Field(None, description="Call objective")

class CallScript(BaseModel):
    opening: Optional[str] = Field(None, description="Opening")
    talking_points: Optional[List[str]] = Field(None, description="Talking points")
    objection_handling: Optional[Dict[str, Any]] = Field(None, description="Objection handling")
    closing: Optional[str] = Field(None, description="Closing")
    follow_up: Optional[List[str]] = Field(None, description="Follow up")

class VoiceSettings(BaseModel):
    voice_type: Optional[str] = Field(None, description="Voice type")
    speech_rate: Optional[float] = Field(None, description="Speech rate")
    language: Optional[str] = Field(None, description="Language")

class SearchCriteria(BaseModel):
    industry: Optional[List[str]] = Field(None, description="Industry")
    company_size: Optional[str] = Field(None, description="Company size")
    job_titles: Optional[List[str]] = Field(None, description="Job titles")
    location: Optional[str] = Field(None, description="Location")

class QualificationCriteria(BaseModel):
    budget_range: Optional[str] = Field(None, description="Budget range")
    decision_making_authority: Optional[bool] = Field(None, description="Decision making authority")
    timeline: Optional[str] = Field(None, description="Timeline")

class TargetProfile(BaseModel):
    profile_id: Optional[str] = Field(None, description="Profile ID")
    platform: Optional[str] = Field(None, description="Platform")
    profile_url: Optional[str] = Field(None, description="Profile URL")
    audience_size: Optional[int] = Field(None, description="Audience size")
    engagement_rate: Optional[float] = Field(None, description="Engagement rate")
    content_categories: Optional[List[str]] = Field(None, description="Content categories")

class TemplateGuidelines(BaseModel):
    max_length: Optional[int] = Field(None, description="Max length")
    tone: Optional[str] = Field(None, description="Tone")
    include_offer: Optional[bool] = Field(None, description="Include offer")

class Authentication(BaseModel):
    auth_type: Optional[List[str]] = Field(None, description="Auth type")
    credentials: Optional[Dict[str, Any]] = Field(None, description="Credentials")

class RetryPolicy(BaseModel):
    max_retries: Optional[int] = Field(None, description="Max retries")
    backoff_strategy: Optional[List[str]] = Field(None, description="Backoff strategy")

# Module Configuration Models
class VisualAssetGenerator(BaseModel):
    prompt: Optional[str] = Field(None, description="Image generation prompt")
    brand_guidelines: Optional[BrandGuidelines] = Field(None, description="Brand guidelines")
    quantity: Optional[int] = Field(None, description="Number of images to generate")
    dimensions: Optional[Dimensions] = Field(None, description="Image dimensions")
    image_style: Optional[List[str]] = Field(None, description="Image style options")
    negative_prompts: Optional[List[str]] = Field(None, description="Negative prompts")

class VideoContentGenerator(BaseModel):
    content_type: Optional[List[str]] = Field(None, description="Content type options")
    script: Optional[str] = Field(None, description="Video script")
    image_inputs: Optional[List[str]] = Field(None, description="Input images")
    duration: Optional[int] = Field(None, description="Video duration in seconds")
    aspect_ratio: Optional[List[str]] = Field(None, description="Aspect ratio options")
    background_music: Optional[BackgroundMusic] = Field(None, description="Background music settings")
    voiceover: Optional[Voiceover] = Field(None, description="Voiceover settings")

class CopyContentGenerator(BaseModel):
    content_purpose: Optional[List[str]] = Field(None, description="Content purpose options")
    campaign_brief: Optional[str] = Field(None, description="Campaign brief")
    tone_of_voice: Optional[List[str]] = Field(None, description="Tone of voice options")
    target_audience: Optional[TargetAudience] = Field(None, description="Target audience")
    word_count_range: Optional[WordCountRange] = Field(None, description="Word count range")
    keywords: Optional[List[str]] = Field(None, description="Keywords")
    call_to_action: Optional[str] = Field(None, description="Call to action")
    variations: Optional[int] = Field(None, description="Number of variations")

class AudienceIntelligenceAnalyzer(BaseModel):
    product_category: Optional[str] = Field(None, description="Product category")
    geographic_location: Optional[GeographicLocation] = Field(None, description="Geographic location")
    campaign_objective: Optional[str] = Field(None, description="Campaign objective")
    existing_customer_data: Optional[ExistingCustomerData] = Field(None, description="Existing customer data")
    competitor_analysis: Optional[bool] = Field(None, description="Competitor analysis flag")

class CampaignTimelineOptimizer(BaseModel):
    campaign_duration: Optional[CampaignDuration] = Field(None, description="Campaign duration")
    content_inventory: Optional[List[ContentInventory]] = Field(None, description="Content inventory")
    audience_segments: Optional[List[str]] = Field(None, description="Audience segments")
    optimal_posting_times: Optional[OptimalPostingTimes] = Field(None, description="Optimal posting times")
    posting_frequency: Optional[PostingFrequency] = Field(None, description="Posting frequency")
    key_dates: Optional[List[KeyDate]] = Field(None, description="Key dates")
    budget_constraints: Optional[Dict[str, Any]] = Field(None, description="Budget constraints")

class ContentDistributionScheduler(BaseModel):
    optimized_timeline: Optional[List[TimelineSlot]] = Field(None, description="Optimized timeline")
    generated_copies: Optional[List[GeneratedCopy]] = Field(None, description="Generated copies")
    generated_images: Optional[List[GeneratedImage]] = Field(None, description="Generated images")
    video_url: Optional[str] = Field(None, description="Video URL")
    platform_specifications: Optional[PlatformSpecifications] = Field(None, description="Platform specifications")

class ContentDistributionExecutor(BaseModel):
    distribution_schedule: Optional[List[ScheduleItem]] = Field(None, description="Distribution schedule")
    platform_credentials: Optional[PlatformCredentials] = Field(None, description="Platform credentials")
    execution_mode: Optional[List[str]] = Field(None, description="Execution mode")
    monitoring_enabled: Optional[bool] = Field(None, description="Monitoring enabled")
    rollback_on_failure: Optional[bool] = Field(None, description="Rollback on failure")

class OutreachCallScheduler(BaseModel):
    discovered_leads: Optional[List[DiscoveredLead]] = Field(None, description="Discovered leads")
    call_window_preferences: Optional[CallWindowPreferences] = Field(None, description="Call window preferences")
    campaign_duration: Optional[CampaignDuration] = Field(None, description="Campaign duration")
    calls_per_day: Optional[int] = Field(None, description="Calls per day")
    prioritization_criteria: Optional[PrioritizationCriteria] = Field(None, description="Prioritization criteria")

class VoiceInteractionAgent(BaseModel):
    call_schedule: Optional[List[CallSchedule]] = Field(None, description="Call schedule")
    conversation_objective: Optional[List[str]] = Field(None, description="Conversation objective")
    call_script: Optional[CallScript] = Field(None, description="Call script")
    voice_settings: Optional[VoiceSettings] = Field(None, description="Voice settings")
    max_call_duration: Optional[int] = Field(None, description="Max call duration")
    auto_dial: Optional[bool] = Field(None, description="Auto dial")

class LeadDiscoveryEngine(BaseModel):
    search_criteria: Optional[SearchCriteria] = Field(None, description="Search criteria")
    audience_segments: Optional[List[str]] = Field(None, description="Audience segments")
    data_sources: Optional[List[str]] = Field(None, description="Data sources")
    qualification_criteria: Optional[QualificationCriteria] = Field(None, description="Qualification criteria")
    max_leads: Optional[int] = Field(None, description="Max leads")
    enrichment_required: Optional[bool] = Field(None, description="Enrichment required")

class CollaborationOutreachComposer(BaseModel):
    target_profiles: Optional[List[TargetProfile]] = Field(None, description="Target profiles")
    discovered_leads: Optional[List[str]] = Field(None, description="Discovered leads")
    campaign_brief: Optional[str] = Field(None, description="Campaign brief")
    generated_copies: Optional[List[str]] = Field(None, description="Generated copies")
    outreach_type: Optional[List[str]] = Field(None, description="Outreach type")
    personalization_level: Optional[List[str]] = Field(None, description="Personalization level")
    template_guidelines: Optional[TemplateGuidelines] = Field(None, description="Template guidelines")

class ExternalApiOrchestrator(BaseModel):
    api_endpoint: Optional[str] = Field(None, description="API endpoint")
    http_method: Optional[List[str]] = Field(None, description="HTTP method")
    request_headers: Optional[Dict[str, Any]] = Field(None, description="Request headers")
    request_body: Optional[Dict[str, Any]] = Field(None, description="Request body")
    authentication: Optional[Authentication] = Field(None, description="Authentication")
    retry_policy: Optional[RetryPolicy] = Field(None, description="Retry policy")
    response_mapping: Optional[Dict[str, Any]] = Field(None, description="Response mapping")

class ModuleConfigurations(BaseModel):
    visual_asset_generator: Optional[VisualAssetGenerator] = Field(None, description="Visual asset generator configuration")
    video_content_generator: Optional[VideoContentGenerator] = Field(None, description="Video content generator configuration")
    copy_content_generator: Optional[CopyContentGenerator] = Field(None, description="Copy content generator configuration")
    audience_intelligence_analyzer: Optional[AudienceIntelligenceAnalyzer] = Field(None, description="Audience intelligence analyzer configuration")
    campaign_timeline_optimizer: Optional[CampaignTimelineOptimizer] = Field(None, description="Campaign timeline optimizer configuration")
    content_distribution_scheduler: Optional[ContentDistributionScheduler] = Field(None, description="Content distribution scheduler configuration")
    content_distribution_executor: Optional[ContentDistributionExecutor] = Field(None, description="Content distribution executor configuration")
    outreach_call_scheduler: Optional[OutreachCallScheduler] = Field(None, description="Outreach call scheduler configuration")
    voice_interaction_agent: Optional[VoiceInteractionAgent] = Field(None, description="Voice interaction agent configuration")
    lead_discovery_engine: Optional[LeadDiscoveryEngine] = Field(None, description="Lead discovery engine configuration")
    collaboration_outreach_composer: Optional[CollaborationOutreachComposer] = Field(None, description="Collaboration outreach composer configuration")
    external_api_orchestrator: Optional[ExternalApiOrchestrator] = Field(None, description="External API orchestrator configuration")

# Request/Response Models
class QuickCampaignRequest(BaseModel):
    brief: str = Field(..., description="Campaign brief description")

class CampaignRequest(BaseModel):
    product: str = Field(..., description="Product or service description")
    target_audience: str = Field(..., description="Target audience description")
    location: str = Field(..., description="Geographic location")
    occasion: Optional[str] = Field(None, description="Special occasion or season")
    budget: Optional[str] = Field(None, description="Budget range")

class ModuleConnection(BaseModel):
    target_module: str = Field(..., description="Target module name")
    source_output: str = Field(..., description="Source output field")
    target_input: str = Field(..., description="Target input field")

class ModuleConnections(BaseModel):
    module_name: str = Field(..., description="Module name")
    connections: List[ModuleConnection] = Field(..., description="Module connections")

class CampaignResponse(BaseModel):
    """Response model for campaign strategy"""
    campaign_brief: str = Field(..., description="Generated campaign brief")
    strategy_plan: str = Field(..., description="Detailed strategy plan")
    research_summary: str = Field(..., description="Summary of research conducted")
    sources: List[str] = Field(..., description="List of sources used")
    module_configurations: Optional[ModuleConfigurations] = Field(None, description="Prefilled module configurations")
    module_connections: Optional[List[ModuleConnections]] = Field(None, description="Module connections and data flow")
    timestamp: datetime = Field(default_factory=datetime.now)

# Visual Asset Generator Models
class VisualAssetRequest(BaseModel):
    prompt: str = Field(..., description="Image generation prompt")
    brand_guidelines: Optional[BrandGuidelines] = Field(None, description="Brand guidelines")
    quantity: int = Field(1, description="Number of images to generate")
    dimensions: Dimensions = Field(default_factory=lambda: Dimensions(width=512, height=512), description="Image dimensions")
    image_style: Optional[List[str]] = Field(["photorealistic"], description="Image style options")
    negative_prompts: Optional[List[str]] = Field(None, description="Negative prompts")

class GeneratedImageResponse(BaseModel):
    image_url: str = Field(..., description="Generated image URL")
    image_id: str = Field(..., description="Unique image ID")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Image metadata")

class GenerationMetadata(BaseModel):
    model_used: str = Field("pollinations-ai", description="Model used for generation")
    generation_time: datetime = Field(default_factory=datetime.now, description="Generation timestamp")
    prompt_tokens: Optional[int] = Field(None, description="Number of prompt tokens")

class VisualAssetResponse(BaseModel):
    outputs: Dict[str, Any] = Field(..., description="Generated outputs")
    generation_metadata: GenerationMetadata = Field(..., description="Generation metadata")
    execution_status: str = Field(..., description="Execution status")

# FastAPI App Setup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize agent on startup"""
    global agent
    try:
        agent = Agent(
            model=Gemini(id="gemini-2.0-flash"),
            tools=[
                ExaTools(start_published_date=calculate_start_date(30), type="keyword"),
                FirecrawlTools(),
            ],
            description="Expert social media campaign strategist with real-time market research capabilities",
            instructions=dedent("""
            You are an expert social media campaign strategist with access to real-time market research tools.
            Your role is to create comprehensive, data-driven campaign strategies that deliver measurable results.
            
            Key capabilities:
            - Real-time market trend analysis using ExaTools
            - Detailed competitor research and benchmarking
            - Audience behavior insights and segmentation
            - Budget optimization and ROI forecasting
            - Content strategy and creative direction
            - Platform-specific optimization recommendations
            
            Always base your recommendations on actual research data gathered from your tools.
            Provide specific, actionable insights with clear rationale and expected outcomes.
            """),
            expected_output="Comprehensive social media campaign strategy with detailed research findings, target audience analysis, content recommendations, budget allocation, timeline, and success metrics."
        )
        print("Agent initialized successfully")
    except Exception as e:
        print(f"Error initializing agent: {e}")
        agent = None
    yield
    # Cleanup on shutdown
    agent = None

app = FastAPI(
    title="Social Media Campaign Strategy API",
    description="AI-powered social media campaign planning with real-time market research",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_module_configurations_fallback(campaign_brief: str) -> ModuleConfigurations:
    """Fallback module configuration extraction without external APIs"""
    
    # Simple keyword-based extraction
    brief_lower = campaign_brief.lower()
    
    # Extract basic information
    brand_name = None
    if "brand" in brief_lower:
        # Try to extract brand name
        words = campaign_brief.split()
        for i, word in enumerate(words):
            if word.lower() in ["brand", "company", "business"]:
                if i + 1 < len(words):
                    brand_name = words[i + 1]
                break
    
    # Extract target audience
    target_audience = None
    if "gen z" in brief_lower:
        target_audience = TargetAudience(
            product_description="Sustainable coffee brand",
            demographics="Gen Z (18-26 years old)",
            psychographics="Environmentally conscious, tech-savvy, social media active",
            pain_points=["Environmental concerns", "Quality vs sustainability", "Price sensitivity"]
        )
    elif "millennial" in brief_lower:
        target_audience = TargetAudience(
            product_description="Fitness app",
            demographics="Millennials (27-42 years old)",
            psychographics="Health-conscious, busy professionals, work-life balance seekers",
            pain_points=["Time constraints", "Motivation", "Consistency"]
        )
    elif "professional" in brief_lower:
        target_audience = TargetAudience(
            product_description="Professional services",
            demographics="Working professionals (25-45 years old)",
            psychographics="Career-focused, efficiency-oriented, quality-conscious",
            pain_points=["Time management", "ROI", "Competitive advantage"]
        )
    
    # Extract geographic location
    geographic_location = None
    if "mumbai" in brief_lower:
        geographic_location = GeographicLocation(
            country="India",
            city="Mumbai",
            region="Maharashtra"
        )
    elif "delhi" in brief_lower:
        geographic_location = GeographicLocation(
            country="India",
            city="Delhi",
            region="Delhi"
        )
    elif "bangalore" in brief_lower:
        geographic_location = GeographicLocation(
            country="India",
            city="Bangalore",
            region="Karnataka"
        )
    
    # Create module configurations
    visual_asset_generator = VisualAssetGenerator(
        prompt=f"Professional marketing visual for {campaign_brief}",
        brand_guidelines=BrandGuidelines(
            colors=["green", "blue", "white"],
            style="Modern and clean",
            logo_url=None
        ),
        quantity=5,
        dimensions=Dimensions(width=1080, height=1080),
        image_style=["photorealistic", "illustration", "minimal"],
        negative_prompts=["blurry", "low quality", "unprofessional"]
    )
    
    video_content_generator = VideoContentGenerator(
        content_type=["text_to_video", "image_sequence", "template_based"],
        script=f"Engaging video script for {campaign_brief}",
        image_inputs=[],
        duration=30,
        aspect_ratio=["16:9", "9:16", "1:1"],
        background_music=BackgroundMusic(
            music_style="upbeat",
            volume=0.7
        ),
        voiceover=Voiceover(
            voice_type="professional",
            language="English"
        )
    )
    
    copy_content_generator = CopyContentGenerator(
        content_purpose=["social_caption", "ad_copy", "blog_post"],
        campaign_brief=campaign_brief,
        tone_of_voice=["professional", "casual", "inspirational"],
        target_audience=target_audience,
        word_count_range=WordCountRange(min=50, max=150),
        keywords=["sustainability", "innovation", "quality"],
        call_to_action="Learn more",
        variations=3
    )
    
    audience_intelligence_analyzer = AudienceIntelligenceAnalyzer(
        product_category="Food & Beverage" if "coffee" in brief_lower else "Technology" if "app" in brief_lower else "General",
        geographic_location=geographic_location,
        campaign_objective="Increase brand awareness and engagement",
        existing_customer_data=ExistingCustomerData(
            age_range="18-35",
            interests=["sustainability", "technology", "lifestyle"],
            behavior_patterns=["social media active", "mobile-first", "value-conscious"]
        ),
        competitor_analysis=True
    )
    
    campaign_timeline_optimizer = CampaignTimelineOptimizer(
        campaign_duration=CampaignDuration(
            start_date="2024-01-01",
            end_date="2024-01-31"
        ),
        content_inventory=[],
        audience_segments=["primary", "secondary"],
        optimal_posting_times=OptimalPostingTimes(
            platform="Instagram",
            time_slots=["09:00", "12:00", "18:00"]
        ),
        posting_frequency=PostingFrequency(
            min_posts_per_day=1,
            max_posts_per_day=3
        ),
        key_dates=[],
        budget_constraints={}
    )
    
    content_distribution_scheduler = ContentDistributionScheduler(
        optimized_timeline=[],
        generated_copies=[],
        generated_images=[],
        video_url=None,
        platform_specifications=PlatformSpecifications(
            platform_name="Instagram",
            max_caption_length=2200,
            supported_formats=["image", "video", "carousel"],
            aspect_ratio_requirements="1:1, 4:5, 16:9"
        )
    )
    
    content_distribution_executor = ContentDistributionExecutor(
        distribution_schedule=[],
        platform_credentials=PlatformCredentials(
            platform_name="Instagram",
            auth_token=None,
            account_id=None
        ),
        execution_mode=["immediate"],
        monitoring_enabled=True,
        rollback_on_failure=True
    )
    
    outreach_call_scheduler = OutreachCallScheduler(
        discovered_leads=[],
        call_window_preferences=CallWindowPreferences(
            timezone="Asia/Kolkata",
            preferred_hours=["10:00", "14:00", "16:00"],
            avoid_dates=[]
        ),
        campaign_duration=CampaignDuration(
            start_date="2024-01-01",
            end_date="2024-01-31"
        ),
        calls_per_day=5,
        prioritization_criteria=PrioritizationCriteria(
            qualification_score_threshold=0.7,
            priority_segments=["high-value", "engaged"]
        )
    )
    
    voice_interaction_agent = VoiceInteractionAgent(
        call_schedule=[],
        conversation_objective=["qualification", "demo_booking"],
        call_script=CallScript(
            opening="Hello, I'm calling about our new product launch",
            talking_points=["product benefits", "special offers", "next steps"],
            objection_handling={},
            closing="Thank you for your time",
            follow_up=["email follow-up", "demo scheduling"]
        ),
        voice_settings=VoiceSettings(
            voice_type="professional",
            speech_rate=1.0,
            language="English"
        ),
        max_call_duration=300,
        auto_dial=False
    )
    
    lead_discovery_engine = LeadDiscoveryEngine(
        search_criteria=SearchCriteria(
            industry=["technology", "food & beverage"],
            company_size="medium",
            job_titles=["marketing manager", "brand manager"],
            location="Mumbai"
        ),
        audience_segments=["primary", "secondary"],
        data_sources=["linkedin", "company_databases"],
        qualification_criteria=QualificationCriteria(
            budget_range="medium",
            decision_making_authority=True,
            timeline="Q1 2024"
        ),
        max_leads=100,
        enrichment_required=True
    )
    
    collaboration_outreach_composer = CollaborationOutreachComposer(
        target_profiles=[],
        discovered_leads=[],
        campaign_brief=campaign_brief,
        generated_copies=[],
        outreach_type=["collaboration", "sponsorship"],
        personalization_level=["medium", "high"],
        template_guidelines=TemplateGuidelines(
            max_length=200,
            tone="professional",
            include_offer=True
        )
    )
    
    external_api_orchestrator = ExternalApiOrchestrator(
        api_endpoint="https://api.example.com",
        http_method=["GET", "POST"],
        request_headers={},
        request_body={},
        authentication=Authentication(
            auth_type=["bearer", "api_key"],
            credentials={}
        ),
        retry_policy=RetryPolicy(
            max_retries=3,
            backoff_strategy=["exponential"]
        ),
        response_mapping={}
    )
    
    return ModuleConfigurations(
        visual_asset_generator=visual_asset_generator,
        video_content_generator=video_content_generator,
        copy_content_generator=copy_content_generator,
        audience_intelligence_analyzer=audience_intelligence_analyzer,
        campaign_timeline_optimizer=campaign_timeline_optimizer,
        content_distribution_scheduler=content_distribution_scheduler,
        content_distribution_executor=content_distribution_executor,
        outreach_call_scheduler=outreach_call_scheduler,
        voice_interaction_agent=voice_interaction_agent,
        lead_discovery_engine=lead_discovery_engine,
        collaboration_outreach_composer=collaboration_outreach_composer,
        external_api_orchestrator=external_api_orchestrator
    )

def get_module_connections() -> List[ModuleConnections]:
    """Get predefined module connections for the workflow"""
    return [
        ModuleConnections(
            module_name="audience_intelligence_analyzer",
            connections=[
                ModuleConnection(
                    target_module="copy_content_generator",
                    source_output="audience_segments",
                    target_input="target_audience"
                ),
                ModuleConnection(
                    target_module="campaign_timeline_optimizer",
                    source_output="audience_segments",
                    target_input="audience_segments"
                ),
                ModuleConnection(
                    target_module="campaign_timeline_optimizer",
                    source_output="optimal_posting_times",
                    target_input="optimal_posting_times"
                ),
                ModuleConnection(
                    target_module="lead_discovery_engine",
                    source_output="audience_segments",
                    target_input="audience_segments"
                )
            ]
        ),
        ModuleConnections(
            module_name="copy_content_generator",
            connections=[
                ModuleConnection(
                    target_module="visual_asset_generator",
                    source_output="generated_copies",
                    target_input="prompt"
                ),
                ModuleConnection(
                    target_module="content_distribution_scheduler",
                    source_output="generated_copies",
                    target_input="generated_copies"
                ),
                ModuleConnection(
                    target_module="collaboration_outreach_composer",
                    source_output="generated_copies",
                    target_input="generated_copies"
                )
            ]
        ),
        ModuleConnections(
            module_name="visual_asset_generator",
            connections=[
                ModuleConnection(
                    target_module="video_content_generator",
                    source_output="generated_images",
                    target_input="image_inputs"
                ),
                ModuleConnection(
                    target_module="content_distribution_scheduler",
                    source_output="generated_images",
                    target_input="generated_images"
                )
            ]
        ),
        ModuleConnections(
            module_name="video_content_generator",
            connections=[
                ModuleConnection(
                    target_module="content_distribution_scheduler",
                    source_output="video_url",
                    target_input="video_url"
                )
            ]
        ),
        ModuleConnections(
            module_name="campaign_timeline_optimizer",
            connections=[
                ModuleConnection(
                    target_module="content_distribution_scheduler",
                    source_output="optimized_timeline",
                    target_input="optimized_timeline"
                )
            ]
        ),
        ModuleConnections(
            module_name="content_distribution_scheduler",
            connections=[
                ModuleConnection(
                    target_module="content_distribution_executor",
                    source_output="distribution_schedule",
                    target_input="distribution_schedule"
                )
            ]
        ),
        ModuleConnections(
            module_name="lead_discovery_engine",
            connections=[
                ModuleConnection(
                    target_module="outreach_call_scheduler",
                    source_output="discovered_leads",
                    target_input="discovered_leads"
                ),
                ModuleConnection(
                    target_module="collaboration_outreach_composer",
                    source_output="discovered_leads",
                    target_input="discovered_leads"
                )
            ]
        ),
        ModuleConnections(
            module_name="outreach_call_scheduler",
            connections=[
                ModuleConnection(
                    target_module="voice_interaction_agent",
                    source_output="call_schedule",
                    target_input="call_schedule"
                )
            ]
        ),
        ModuleConnections(
            module_name="voice_interaction_agent",
            connections=[
                ModuleConnection(
                    target_module="external_api_orchestrator",
                    source_output="call_results",
                    target_input="request_body"
                ),
                ModuleConnection(
                    target_module="external_api_orchestrator",
                    source_output="extracted_intelligence",
                    target_input="request_body"
                )
            ]
        ),
        ModuleConnections(
            module_name="collaboration_outreach_composer",
            connections=[
                ModuleConnection(
                    target_module="content_distribution_executor",
                    source_output="outreach_messages",
                    target_input="distribution_schedule"
                )
            ]
        ),
        ModuleConnections(
            module_name="content_distribution_executor",
            connections=[
                ModuleConnection(
                    target_module="external_api_orchestrator",
                    source_output="executed_posts",
                    target_input="request_body"
                )
            ]
        ),
        ModuleConnections(
            module_name="external_api_orchestrator",
            connections=[
                ModuleConnection(
                    target_module="any_module",
                    source_output="parsed_data",
                    target_input="[compatible_field]"
                )
            ]
        )
    ]

# Routes
@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Social Media Campaign Strategy API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent_ready": agent is not None,
        "timestamp": datetime.now()
    }

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
    
    Note: This endpoint does NOT include module connections.
    Use /campaign/quick for module connections.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        # Construct campaign brief from request
        campaign_brief = f"""
        Create a social media campaign for:
        - Product/Service: {request.product}
        - Target Audience: {request.target_audience}
        - Location: {request.location}
        - Occasion: {request.occasion or 'General promotion'}
        - Budget: {request.budget or 'Medium budget'}
        """
        
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
        module_configurations = extract_module_configurations_fallback(campaign_brief)
        
        # Get module connections (null for this endpoint)
        module_connections = None
        
        # Extract sources
        sources = ["ExaTools research", "FirecrawlTools scraping"]
        
        return CampaignResponse(
            campaign_brief=campaign_brief,
            strategy_plan=strategy_plan,
            research_summary="Research conducted using ExaTools and FirecrawlTools with comprehensive field extraction",
            sources=sources,
            module_configurations=module_configurations,
            module_connections=module_connections
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
    3. Module connections for workflow orchestration
    4. Extracted and inferred fields based on the campaign brief
    
    This is the ONLY endpoint that includes module connections.
    The module configurations and connections can be used directly for content generation workflows.
    """
    if not agent:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    try:
        # Check cache first
        cache_key = get_cache_key(request.brief)
        cached_response = response_cache.get(cache_key)
        
        if cached_response and is_cache_valid(cached_response):
            print("Using cached response to avoid rate limits")
            return CampaignResponse(**cached_response["data"])
        
        # Check rate limits before making API calls
        rate_limits = check_rate_limits()
        
        if not rate_limits["exa_available"] and not rate_limits["firecrawl_available"]:
            print("Rate limits exceeded, using fallback strategy...")
            raise Exception("Rate limit exceeded - using fallback")
        
        # Generate comprehensive strategy plan using agent with retry logic
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
        
        # Use retry logic for agent calls
        async def run_agent():
            return agent.run(strategy_prompt)
        
        response = await retry_with_backoff(run_agent)
        strategy_plan = response.content if hasattr(response, 'content') else str(response)
        
        # Update rate limit counters
        rate_limit_tracker["exa_requests_count"] += 1
        rate_limit_tracker["firecrawl_requests_count"] += 1
        
        # Extract module configurations using LLM with retry
        async def extract_configs():
            return extract_module_configurations_fallback(request.brief)
        
        module_configurations = await retry_with_backoff(extract_configs)
        
        # Get module connections
        module_connections = get_module_connections()
        
        # Extract sources
        sources = ["ExaTools research", "FirecrawlTools scraping"]
        
        response_data = CampaignResponse(
            campaign_brief=request.brief,
            strategy_plan=strategy_plan,
            research_summary="Research conducted using ExaTools and FirecrawlTools with comprehensive field extraction",
            sources=sources,
            module_configurations=module_configurations,
            module_connections=module_connections
        )
        
        # Cache the response
        response_cache[cache_key] = {
            "data": response_data.dict(),
            "timestamp": time.time()
        }
        
        return response_data
        
    except Exception as e:
        # Check if it's a rate limiting error
        if "429" in str(e) or "Too Many Requests" in str(e):
            print("Rate limit hit, using fallback strategy generation...")
            
            # Generate fallback strategy without external APIs
            fallback_strategy = f"""
            # Campaign Strategy for: {request.brief}
            
            ## Campaign Overview
            Based on your brief, here's a comprehensive social media campaign strategy:
            
            ### Target Audience Analysis
            - Primary audience: {request.brief.split('targeting')[1].split('for')[0].strip() if 'targeting' in request.brief else 'General audience'}
            - Geographic focus: {request.brief.split('in')[1].split('for')[0].strip() if 'in' in request.brief else 'Global'}
            - Campaign context: {request.brief.split('for')[1].strip() if 'for' in request.brief else 'General promotion'}
            
            ### Content Strategy
            1. **Visual Content**: Create engaging visuals that align with your brand
            2. **Copy Strategy**: Develop compelling copy that resonates with your target audience
            3. **Platform Optimization**: Tailor content for each social media platform
            4. **Engagement Tactics**: Use interactive elements to boost engagement
            
            ### Campaign Timeline
            - Duration: 30 days
            - Phase 1 (Days 1-10): Brand awareness and introduction
            - Phase 2 (Days 11-20): Engagement and community building
            - Phase 3 (Days 21-30): Conversion and retention
            
            ### Success Metrics
            - Reach and impressions
            - Engagement rate
            - Click-through rate
            - Conversion rate
            
            Note: This strategy was generated using fallback logic due to API rate limits.
            """
            
            # Use fallback module configurations
            module_configurations = extract_module_configurations_fallback(request.brief)
            
            # Get module connections
            module_connections = get_module_connections()
            
            return CampaignResponse(
                campaign_brief=request.brief,
                strategy_plan=fallback_strategy,
                research_summary="Strategy generated using fallback logic (external APIs rate limited)",
                sources=["Fallback strategy generation", "Keyword-based extraction"],
                module_configurations=module_configurations,
                module_connections=module_connections
            )
        else:
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
                "brief": "Create a fitness app campaign targeting millennials in Delhi with high budget for Q1 launch",
                "category": "Health & Fitness"
            },
            {
                "title": "Eco-Friendly Fashion",
                "brief": "Promote our eco-friendly fashion brand to environmentally conscious consumers in Bangalore",
                "category": "Fashion & Lifestyle"
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

@app.get("/rate-limits")
async def get_rate_limit_status():
    """Get current rate limit status"""
    rate_limits = check_rate_limits()
    current_time = time.time()
    
    return {
        "exa_status": {
            "available": rate_limits["exa_available"],
            "requests_count": rate_limit_tracker["exa_requests_count"],
            "last_reset": rate_limit_tracker["exa_last_reset"],
            "time_until_reset": max(0, 3600 - (current_time - rate_limit_tracker["exa_last_reset"]))
        },
        "firecrawl_status": {
            "available": rate_limits["firecrawl_available"],
            "requests_count": rate_limit_tracker["firecrawl_requests_count"],
            "last_reset": rate_limit_tracker["firecrawl_last_reset"],
            "time_until_reset": max(0, 3600 - (current_time - rate_limit_tracker["firecrawl_last_reset"]))
        },
        "cache_status": {
            "cached_responses": len(response_cache),
            "cache_duration_hours": CACHE_DURATION / 3600
        }
    }

@app.post("/clear-cache")
async def clear_cache():
    """Clear response cache"""
    global response_cache
    response_cache.clear()
    return {"message": "Cache cleared successfully", "timestamp": datetime.now()}

@app.get("/module/connections")
async def get_module_connections_endpoint():
    """Get module connections structure"""
    connections = get_module_connections()
    return {
        "total_modules": len(connections),
        "module_connections": connections,
        "description": "Predefined workflow connections between content generation modules"
    }

@app.post("/visual_asset_generator", response_model=VisualAssetResponse)
async def generate_visual_assets(request: VisualAssetRequest):
    """
    Generate visual assets using Pollinations AI
    
    This endpoint generates images based on:
    - Prompt description
    - Brand guidelines (colors, style, logo)
    - Quantity of images needed
    - Dimensions (width, height)
    - Image style preferences
    - Negative prompts to avoid
    """
    try:
        # Enhance prompt with brand guidelines if provided
        enhanced_prompt = request.prompt
        
        if request.brand_guidelines:
            if request.brand_guidelines.colors:
                color_text = ", ".join(request.brand_guidelines.colors)
                enhanced_prompt += f", {color_text} color scheme"
            
            if request.brand_guidelines.style:
                enhanced_prompt += f", {request.brand_guidelines.style} style"
        
        # Add negative prompts if provided
        if request.negative_prompts:
            negative_text = ", ".join(request.negative_prompts)
            enhanced_prompt += f", avoid {negative_text}"
        
        # Determine image style based on request
        image_style = "photorealistic"
        if request.image_style:
            if "illustration" in request.image_style:
                image_style = "illustration"
            elif "minimal" in request.image_style:
                image_style = "minimal"
            elif "abstract" in request.image_style:
                image_style = "abstract"
        
        # Prepare arguments for the visual_asset_manager
        args = {
            "prompt": enhanced_prompt,
            "quantity": request.quantity,
            "dimensions": {
                "width": request.dimensions.width,
                "height": request.dimensions.height
            },
            "image_style": image_style
        }
        
        # Generate images using the image.py service
        result = visual_asset_manager(args)
        
        # Check for errors
        if "error" in result:
            raise HTTPException(status_code=400, detail=f"Image generation error: {result['error']}")
        
        image_urls = result.get("image_urls", [])
        
        # Process results and create response
        generated_images = []
        successful_images = 0
        failed_images = 0
        
        for i, image_url in enumerate(image_urls):
            if isinstance(image_url, str):  # Successful generation
                image_response = GeneratedImageResponse(
                    image_url=image_url,
                    image_id=f"img_{int(time.time())}_{i}",
                    metadata={
                        "prompt": enhanced_prompt,
                        "style": image_style,
                        "dimensions": {
                            "width": request.dimensions.width,
                            "height": request.dimensions.height
                        },
                        "generation_index": i
                    }
                )
                generated_images.append(image_response)
                successful_images += 1
            else:  # Error case
                failed_images += 1
        
        # Determine execution status
        if successful_images == request.quantity:
            execution_status = "success"
        elif successful_images > 0:
            execution_status = "partial_success"
        else:
            execution_status = "failed"
        
        # Create response
        response = VisualAssetResponse(
            outputs={
                "generated_images": generated_images
            },
            generation_metadata=GenerationMetadata(
                model_used="pollinations-ai",
                generation_time=datetime.now(),
                prompt_tokens=len(enhanced_prompt.split())
            ),
            execution_status=execution_status
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating visual assets: {str(e)}")

@app.post("/audience_intelligence_analyzer", response_model=AudienceIntelligenceResponse)
async def analyze_audience(request: AudienceIntelligenceRequest):
    """
    Analyze audience intelligence and generate comprehensive insights
    
    This endpoint performs deep audience analysis including:
    - Audience segmentation with demographics and psychographics
    - Detailed persona profiles
    - Platform recommendations
    - Optimal posting times
    - Content preferences
    
    Uses LLM-powered analysis with real-time research capabilities.
    """
    try:
        print(f"🎯 Analyzing audience intelligence for {request.product_category} in {request.geographic_location.city or request.geographic_location.country}")
        
        # Call the audience intelligence analyzer
        result = analyze_audience_intelligence(request)
        
        print(f"✅ Analysis completed with status: {result.execution_status}")
        print(f"📊 Generated {len(result.outputs.get('audience_segments', []))} audience segments")
        print(f"👥 Created {len(result.outputs.get('persona_profiles', []))} persona profiles")
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing audience intelligence: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
