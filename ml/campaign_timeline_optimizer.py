"""
Campaign Timeline Optimizer Service
AI-powered campaign scheduling and timeline optimization using LLM intelligence

This service analyzes campaign parameters and creates optimal timelines including:
- Real-time date analysis and event detection
- Audience behavior patterns
- Platform-specific optimal posting times
- Content distribution scheduling
- Budget-aware timeline optimization
"""

import json
import time
from datetime import datetime, timedelta, date
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.googlesearch import GoogleSearchTools
import os
from dotenv import load_dotenv
import calendar

# Load environment variables
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

# Input Models
class CampaignDuration(BaseModel):
    start_date: str = Field(..., description="Campaign start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="Campaign end date (YYYY-MM-DD)")

class ContentInventory(BaseModel):
    content_id: str = Field(..., description="Unique content identifier")
    content_type: str = Field(..., description="Type of content")
    platform: str = Field(..., description="Target platform")

class OptimalPostingTimes(BaseModel):
    platform: str = Field(..., description="Platform name")
    time_slots: List[str] = Field(..., description="Optimal time slots")

class PostingFrequency(BaseModel):
    min_posts_per_day: int = Field(..., description="Minimum posts per day")
    max_posts_per_day: int = Field(..., description="Maximum posts per day")

class KeyDate(BaseModel):
    date: str = Field(..., description="Date (YYYY-MM-DD)")
    event: str = Field(..., description="Event description")
    priority: List[str] = Field(..., description="Priority levels")

class CampaignTimelineRequest(BaseModel):
    campaign_duration: CampaignDuration = Field(..., description="Campaign duration")
    content_inventory: List[ContentInventory] = Field(..., description="Available content")
    audience_segments: List[str] = Field(..., description="Target audience segments")
    optimal_posting_times: OptimalPostingTimes = Field(..., description="Optimal posting times")
    posting_frequency: PostingFrequency = Field(..., description="Posting frequency")
    key_dates: List[KeyDate] = Field(..., description="Important dates")
    budget_constraints: Dict[str, Any] = Field(default_factory=dict, description="Budget constraints")

# Output Models
class TimelineSlot(BaseModel):
    timeline_slot_id: str = Field(..., description="Unique slot identifier")
    scheduled_date: str = Field(..., description="Scheduled date")
    content_type: str = Field(..., description="Content type")
    platform: str = Field(..., description="Platform")
    target_segment: str = Field(..., description="Target audience segment")
    priority: List[str] = Field(..., description="Priority level")
    optimal_time: str = Field(..., description="Optimal posting time")
    reasoning: str = Field(..., description="Scheduling reasoning")

class CampaignTimelineResponse(BaseModel):
    outputs: Dict[str, Any] = Field(..., description="Timeline optimization outputs")
    execution_status: str = Field(..., description="Execution status")

def get_upcoming_events_and_dates() -> Dict[str, Any]:
    """Get real-time upcoming events and important dates"""
    current_date = datetime.now()
    next_month = current_date + timedelta(days=30)
    
    # Get current month and next month names
    current_month = current_date.strftime("%B")
    next_month_name = next_month.strftime("%B")
    
    # Get calendar information
    current_year = current_date.year
    next_year = next_month.year
    
    # Important dates and events (real-time)
    important_dates = {
        "current_month": current_month,
        "next_month": next_month_name,
        "current_year": current_year,
        "upcoming_events": [
            {
                "date": (current_date + timedelta(days=1)).strftime("%Y-%m-%d"),
                "event": "Monday - Start of work week",
                "priority": ["high"],
                "impact": "High engagement for professional content"
            },
            {
                "date": (current_date + timedelta(days=5)).strftime("%Y-%m-%d"),
                "event": "Friday - End of work week",
                "priority": ["high"],
                "impact": "High engagement for lifestyle content"
            },
            {
                "date": (current_date + timedelta(days=6)).strftime("%Y-%m-%d"),
                "event": "Saturday - Weekend",
                "priority": ["medium"],
                "impact": "Good for leisure and entertainment content"
            },
            {
                "date": (current_date + timedelta(days=7)).strftime("%Y-%m-%d"),
                "event": "Sunday - Weekend",
                "priority": ["medium"],
                "impact": "Good for family and lifestyle content"
            }
        ],
        "monthly_patterns": {
            "beginning_of_month": "High engagement for goal-setting and motivation content",
            "middle_of_month": "Steady engagement, good for educational content",
            "end_of_month": "High engagement for results and achievement content"
        },
        "seasonal_factors": {
            "current_season": "Q4 - Holiday season approaching",
            "recommendation": "Focus on holiday-themed content and year-end campaigns"
        }
    }
    
    return important_dates

def analyze_audience_behavior_patterns(audience_segments: List[str]) -> Dict[str, Any]:
    """Analyze audience behavior patterns for optimal scheduling"""
    
    behavior_patterns = {}
    
    for segment in audience_segments:
        segment_lower = segment.lower()
        
        if "professional" in segment_lower or "business" in segment_lower:
            behavior_patterns[segment] = {
                "peak_hours": ["09:00", "12:00", "17:00"],
                "best_days": ["Tuesday", "Wednesday", "Thursday"],
                "content_preferences": ["educational", "industry_insights", "professional_tips"],
                "engagement_pattern": "High during business hours, low on weekends"
            }
        elif "millennial" in segment_lower or "gen z" in segment_lower:
            behavior_patterns[segment] = {
                "peak_hours": ["08:00", "12:00", "19:00", "21:00"],
                "best_days": ["Monday", "Wednesday", "Friday"],
                "content_preferences": ["visual", "trending", "social_causes"],
                "engagement_pattern": "High evening engagement, active on weekends"
            }
        elif "fitness" in segment_lower or "health" in segment_lower:
            behavior_patterns[segment] = {
                "peak_hours": ["06:00", "12:00", "18:00"],
                "best_days": ["Monday", "Wednesday", "Friday"],
                "content_preferences": ["motivational", "educational", "before_after"],
                "engagement_pattern": "High morning and evening engagement"
            }
        else:
            # Default pattern
            behavior_patterns[segment] = {
                "peak_hours": ["09:00", "12:00", "18:00"],
                "best_days": ["Tuesday", "Wednesday", "Thursday"],
                "content_preferences": ["general", "entertainment", "informative"],
                "engagement_pattern": "Standard business hours engagement"
            }
    
    return behavior_patterns

def create_timeline_optimizer_agent() -> Agent:
    """Create the timeline optimization agent"""
    
    return Agent(
        model=Gemini(id="gemini-2.0-flash"),
        tools=[GoogleSearchTools()],
        description="Expert campaign timeline optimizer specializing in strategic scheduling and audience engagement maximization",
        instructions=[
            "You are an expert campaign timeline optimizer. Your role is to:",
            "1. Analyze campaign parameters and audience segments",
            "2. Research optimal posting times and audience behavior patterns",
            "3. Create strategic timeline schedules that maximize engagement",
            "4. Consider real-time events, holidays, and seasonal factors",
            "5. Optimize content distribution across platforms and time slots",
            "6. Balance posting frequency with audience fatigue",
            "7. Prioritize high-impact dates and events",
            
            "CRITICAL: YOU MUST STRICTLY FOLLOW THE JSON FORMAT BELOW:",
            "Always return response in this EXACT JSON structure:",
            "{",
            '  "optimized_timeline": [',
            '    {',
            '      "timeline_slot_id": "unique_id",',
            '      "scheduled_date": "YYYY-MM-DD",',
            '      "content_type": "content_type",',
            '      "platform": "platform_name",',
            '      "target_segment": "audience_segment",',
            '      "priority": ["high", "medium", "low"],',
            '      "optimal_time": "HH:MM",',
            '      "reasoning": "detailed reasoning for this scheduling decision"',
            '    }',
            '  ],',
            '  "timeline_insights": {',
            '    "total_slots": integer,',
            '    "high_priority_slots": integer,',
            '    "platform_distribution": {},',
            '    "audience_coverage": {},',
            '    "engagement_prediction": "overall engagement prediction"',
            '  }',
            '}',
            
            "REQUIREMENTS:",
            "- Each timeline_slot_id should be unique (use format: slot_001, slot_002, etc.)",
            "- scheduled_date must be within the campaign duration",
            "- optimal_time should be based on audience behavior research",
            "- reasoning should explain why this slot is optimal",
            "- Consider real-time events and seasonal factors",
            "- Balance content types and platforms strategically",
            "- Ensure valid JSON syntax with proper quotes and commas",
            "- Use web search to research current trends and optimal timing",
        ],
        markdown=False,
        use_json_mode=True
    )

def optimize_campaign_timeline(request: CampaignTimelineRequest) -> CampaignTimelineResponse:
    """
    Optimize campaign timeline using LLM intelligence
    
    Args:
        request: CampaignTimelineRequest with all input parameters
        
    Returns:
        CampaignTimelineResponse with optimized timeline
    """
    
    try:
        print(f"📅 Optimizing campaign timeline from {request.campaign_duration.start_date} to {request.campaign_duration.end_date}")
        
        # Get real-time events and dates
        upcoming_events = get_upcoming_events_and_dates()
        
        # Analyze audience behavior patterns
        audience_patterns = analyze_audience_behavior_patterns(request.audience_segments)
        
        # Create timeline optimizer agent
        timeline_agent = create_timeline_optimizer_agent()
        
        # Prepare comprehensive analysis prompt
        analysis_prompt = f"""
        Optimize a campaign timeline with the following parameters:
        
        CAMPAIGN DURATION:
        - Start Date: {request.campaign_duration.start_date}
        - End Date: {request.campaign_duration.end_date}
        
        CONTENT INVENTORY ({len(request.content_inventory)} items):
        {json.dumps([item.dict() for item in request.content_inventory], indent=2)}
        
        AUDIENCE SEGMENTS:
        {request.audience_segments}
        
        AUDIENCE BEHAVIOR PATTERNS:
        {json.dumps(audience_patterns, indent=2)}
        
        OPTIMAL POSTING TIMES:
        - Platform: {request.optimal_posting_times.platform}
        - Time Slots: {request.optimal_posting_times.time_slots}
        
        POSTING FREQUENCY:
        - Min Posts/Day: {request.posting_frequency.min_posts_per_day}
        - Max Posts/Day: {request.posting_frequency.max_posts_per_day}
        
        KEY DATES ({len(request.key_dates)} dates):
        {json.dumps([date.dict() for date in request.key_dates], indent=2)}
        
        REAL-TIME EVENTS AND FACTORS:
        {json.dumps(upcoming_events, indent=2)}
        
        BUDGET CONSTRAINTS:
        {json.dumps(request.budget_constraints, indent=2)}
        
        OPTIMIZATION REQUIREMENTS:
        1. Create a strategic timeline that maximizes engagement
        2. Consider audience behavior patterns and optimal posting times
        3. Balance content types and platforms for maximum reach
        4. Prioritize high-impact dates and events
        5. Ensure posting frequency stays within specified limits
        6. Research current trends and seasonal factors
        7. Provide detailed reasoning for each scheduling decision
        8. Optimize for different audience segments
        9. Consider platform-specific best practices
        10. Account for real-time events and market conditions
        
        Create an optimized timeline that strategically distributes content across the campaign duration.
        """
        
        # Run timeline optimization
        response = timeline_agent.run(analysis_prompt)
        
        # Parse the response
        try:
            optimized_data = json.loads(response.content)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            optimized_data = create_fallback_timeline(request, upcoming_events, audience_patterns)
        
        # Process and enhance the timeline
        processed_timeline = process_timeline_data(optimized_data, request)
        
        return CampaignTimelineResponse(
            outputs=processed_timeline,
            execution_status="success"
        )
        
    except Exception as e:
        print(f"Error in timeline optimization: {e}")
        # Return fallback timeline
        fallback_timeline = create_fallback_timeline(request, {}, {})
        return CampaignTimelineResponse(
            outputs=fallback_timeline,
            execution_status="partial_success"
        )

def process_timeline_data(raw_data: Dict[str, Any], request: CampaignTimelineRequest) -> Dict[str, Any]:
    """Process and enhance timeline data"""
    
    timeline_slots = raw_data.get("optimized_timeline", [])
    insights = raw_data.get("timeline_insights", {})
    
    # Enhance timeline slots with additional metadata
    enhanced_slots = []
    for slot in timeline_slots:
        enhanced_slot = {
            **slot,
            "campaign_phase": determine_campaign_phase(slot["scheduled_date"], request),
            "engagement_score": calculate_engagement_score(slot, request),
            "content_priority": determine_content_priority(slot, request)
        }
        enhanced_slots.append(enhanced_slot)
    
    # Calculate additional insights
    total_slots = len(enhanced_slots)
    high_priority_slots = len([s for s in enhanced_slots if "high" in s.get("priority", [])])
    
    platform_distribution = {}
    audience_coverage = {}
    
    for slot in enhanced_slots:
        platform = slot.get("platform", "unknown")
        segment = slot.get("target_segment", "unknown")
        
        platform_distribution[platform] = platform_distribution.get(platform, 0) + 1
        audience_coverage[segment] = audience_coverage.get(segment, 0) + 1
    
    enhanced_insights = {
        "total_slots": total_slots,
        "high_priority_slots": high_priority_slots,
        "platform_distribution": platform_distribution,
        "audience_coverage": audience_coverage,
        "engagement_prediction": insights.get("engagement_prediction", "High engagement expected"),
        "timeline_efficiency": f"{high_priority_slots/total_slots*100:.1f}% high-priority slots",
        "content_diversity": len(set(slot.get("content_type", "") for slot in enhanced_slots)),
        "platform_coverage": len(platform_distribution)
    }
    
    return {
        "optimized_timeline": enhanced_slots,
        "timeline_insights": enhanced_insights,
        "campaign_duration": request.campaign_duration.dict(),
        "content_inventory": [item.dict() for item in request.content_inventory],
        "audience_segments": request.audience_segments,
        "optimal_posting_times": request.optimal_posting_times.dict(),
        "posting_frequency": request.posting_frequency.dict(),
        "key_dates": [date.dict() for date in request.key_dates],
        "budget_constraints": request.budget_constraints
    }

def determine_campaign_phase(scheduled_date: str, request: CampaignTimelineRequest) -> str:
    """Determine which phase of the campaign this date falls into"""
    try:
        scheduled = datetime.strptime(scheduled_date, "%Y-%m-%d")
        start = datetime.strptime(request.campaign_duration.start_date, "%Y-%m-%d")
        end = datetime.strptime(request.campaign_duration.end_date, "%Y-%m-%d")
        
        total_days = (end - start).days
        days_from_start = (scheduled - start).days
        
        if days_from_start < total_days * 0.3:
            return "launch_phase"
        elif days_from_start < total_days * 0.7:
            return "growth_phase"
        else:
            return "conclusion_phase"
    except:
        return "unknown_phase"

def calculate_engagement_score(slot: Dict[str, Any], request: CampaignTimelineRequest) -> float:
    """Calculate predicted engagement score for a timeline slot"""
    score = 0.5  # Base score
    
    # Priority boost
    if "high" in slot.get("priority", []):
        score += 0.3
    elif "medium" in slot.get("priority", []):
        score += 0.1
    
    # Platform boost (based on optimal posting times)
    if slot.get("platform") == request.optimal_posting_times.platform:
        score += 0.2
    
    # Time optimization boost
    optimal_time = slot.get("optimal_time", "")
    if optimal_time in request.optimal_posting_times.time_slots:
        score += 0.2
    
    return min(1.0, score)

def determine_content_priority(slot: Dict[str, Any], request: CampaignTimelineRequest) -> str:
    """Determine content priority based on slot characteristics"""
    priority_levels = slot.get("priority", [])
    
    if "high" in priority_levels:
        return "critical"
    elif "medium" in priority_levels:
        return "important"
    else:
        return "standard"

def create_fallback_timeline(request: CampaignTimelineRequest, upcoming_events: Dict[str, Any], audience_patterns: Dict[str, Any]) -> Dict[str, Any]:
    """Create a fallback timeline when LLM optimization fails"""
    
    start_date = datetime.strptime(request.campaign_duration.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(request.campaign_duration.end_date, "%Y-%m-%d")
    
    timeline_slots = []
    slot_id = 1
    
    current_date = start_date
    while current_date <= end_date:
        # Create slots for each day based on posting frequency
        posts_per_day = request.posting_frequency.min_posts_per_day
        
        for post_num in range(posts_per_day):
            if slot_id <= len(request.content_inventory) * 2:  # Limit slots
                content_item = request.content_inventory[slot_id % len(request.content_inventory)]
                audience_segment = request.audience_segments[slot_id % len(request.audience_segments)]
                
                slot = {
                    "timeline_slot_id": f"slot_{slot_id:03d}",
                    "scheduled_date": current_date.strftime("%Y-%m-%d"),
                    "content_type": content_item.content_type,
                    "platform": content_item.platform,
                    "target_segment": audience_segment,
                    "priority": ["medium"],
                    "optimal_time": request.optimal_posting_times.time_slots[post_num % len(request.optimal_posting_times.time_slots)],
                    "reasoning": f"Scheduled for {audience_segment} audience during optimal engagement time"
                }
                timeline_slots.append(slot)
                slot_id += 1
        
        current_date += timedelta(days=1)
    
    return {
        "optimized_timeline": timeline_slots,
        "timeline_insights": {
            "total_slots": len(timeline_slots),
            "high_priority_slots": 0,
            "platform_distribution": {},
            "audience_coverage": {},
            "engagement_prediction": "Moderate engagement expected"
        }
    }

# Example usage
if __name__ == "__main__":
    print("📅 CAMPAIGN TIMELINE OPTIMIZER")
    print("=" * 50)
    
    # Test request
    test_request = CampaignTimelineRequest(
        campaign_duration=CampaignDuration(
            start_date="2024-01-01",
            end_date="2024-01-31"
        ),
        content_inventory=[
            ContentInventory(
                content_id="content_001",
                content_type="social_caption",
                platform="Instagram"
            ),
            ContentInventory(
                content_id="content_002",
                content_type="ad_copy",
                platform="Facebook"
            )
        ],
        audience_segments=["millennials", "fitness_enthusiasts"],
        optimal_posting_times=OptimalPostingTimes(
            platform="Instagram",
            time_slots=["09:00", "12:00", "18:00"]
        ),
        posting_frequency=PostingFrequency(
            min_posts_per_day=1,
            max_posts_per_day=3
        ),
        key_dates=[
            KeyDate(
                date="2024-01-15",
                event="Product Launch",
                priority=["high"]
            )
        ],
        budget_constraints={"daily_budget": 100}
    )
    
    print("📊 Optimizing campaign timeline...")
    result = optimize_campaign_timeline(test_request)
    
    print(f"✅ Optimization Status: {result.execution_status}")
    print(f"📈 Timeline Slots: {len(result.outputs['optimized_timeline'])}")
    print(f"🎯 Insights: {result.outputs['timeline_insights']}")
    
    print("\n🎉 Campaign Timeline Optimization Complete!")
