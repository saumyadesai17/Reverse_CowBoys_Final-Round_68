"""
Outreach Call Scheduler Service
AI-powered call scheduling that creates detailed outreach call schedules

This service takes discovered leads and creates specific call schedules:
- Maps leads to optimal calling times based on timezone and preferences
- Prioritizes leads based on qualification scores and segments
- Considers call window preferences and availability
- Creates detailed call objectives and expected durations
- Provides comprehensive schedule summaries and analytics
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
import random

# Load environment variables
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

# Input Models
class DiscoveredLead(BaseModel):
    lead_id: str = Field(..., description="Lead identifier")
    company_name: str = Field(..., description="Company name")
    contact_name: str = Field(..., description="Contact person name")
    email: str = Field(..., description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    job_title: str = Field(..., description="Job title")
    industry: str = Field(..., description="Industry")
    company_size: str = Field(..., description="Company size")
    location: str = Field(..., description="Location")
    qualification_score: float = Field(..., description="Lead qualification score (0-100)")
    lead_source: str = Field(..., description="Lead source")
    last_contact_date: Optional[str] = Field(None, description="Last contact date")
    notes: Optional[str] = Field(None, description="Additional notes")

class CallWindowPreferences(BaseModel):
    timezone: str = Field(..., description="Timezone for calls")
    preferred_hours: List[str] = Field(..., description="Preferred calling hours")
    avoid_dates: List[str] = Field(default_factory=list, description="Dates to avoid")

class CampaignDuration(BaseModel):
    start_date: str = Field(..., description="Campaign start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="Campaign end date (YYYY-MM-DD)")

class PrioritizationCriteria(BaseModel):
    qualification_score_threshold: float = Field(..., description="Minimum qualification score")
    priority_segments: List[str] = Field(..., description="Priority industry segments")

class OutreachCallRequest(BaseModel):
    discovered_leads: List[DiscoveredLead] = Field(..., description="Discovered leads from lead discovery engine")
    call_window_preferences: CallWindowPreferences = Field(..., description="Call window preferences")
    campaign_duration: CampaignDuration = Field(..., description="Campaign duration")
    calls_per_day: int = Field(..., description="Number of calls per day")
    prioritization_criteria: PrioritizationCriteria = Field(..., description="Prioritization criteria")

# Output Models
class LeadContactInfo(BaseModel):
    company_name: str = Field(..., description="Company name")
    contact_name: str = Field(..., description="Contact person name")
    email: str = Field(..., description="Email address")
    phone: Optional[str] = Field(None, description="Phone number")
    job_title: str = Field(..., description="Job title")
    industry: str = Field(..., description="Industry")
    company_size: str = Field(..., description="Company size")
    location: str = Field(..., description="Location")

class CallScheduleItem(BaseModel):
    schedule_id: str = Field(..., description="Schedule item identifier")
    lead_id: str = Field(..., description="Lead identifier")
    lead_contact_info: LeadContactInfo = Field(..., description="Lead contact information")
    scheduled_datetime: str = Field(..., description="Scheduled datetime (YYYY-MM-DD HH:MM)")
    call_objective: str = Field(..., description="Call objective")
    expected_duration: int = Field(..., description="Expected call duration in minutes")
    priority_level: str = Field(..., description="Priority level")

class ScheduleSummary(BaseModel):
    total_calls_scheduled: int = Field(..., description="Total number of calls scheduled")
    daily_distribution: Dict[str, int] = Field(..., description="Calls per day distribution")
    coverage_percentage: float = Field(..., description="Percentage of leads covered")
    estimated_completion_date: str = Field(..., description="Estimated completion date")

class OutreachCallResponse(BaseModel):
    outputs: Dict[str, Any] = Field(..., description="Call schedule outputs")
    execution_status: str = Field(..., description="Execution status")

def analyze_timezone_and_availability(call_preferences: CallWindowPreferences) -> Dict[str, Any]:
    """Analyze timezone and calling availability patterns"""
    
    timezone_analysis = {
        "timezone": call_preferences.timezone,
        "preferred_hours": call_preferences.preferred_hours,
        "avoid_dates": call_preferences.avoid_dates,
        "optimal_calling_windows": {},
        "timezone_considerations": {}
    }
    
    # Analyze optimal calling windows based on timezone
    timezone = call_preferences.timezone.lower()
    
    if "est" in timezone or "eastern" in timezone:
        timezone_analysis["optimal_calling_windows"] = {
            "morning": "09:00-11:00",
            "afternoon": "14:00-16:00",
            "evening": "17:00-18:00"
        }
        timezone_analysis["timezone_considerations"] = {
            "business_hours": "9 AM - 6 PM EST",
            "lunch_break": "12:00-13:00",
            "avoid_times": "Early morning (before 9 AM), Late evening (after 6 PM)"
        }
    elif "pst" in timezone or "pacific" in timezone:
        timezone_analysis["optimal_calling_windows"] = {
            "morning": "10:00-12:00",
            "afternoon": "14:00-16:00",
            "evening": "17:00-18:00"
        }
        timezone_analysis["timezone_considerations"] = {
            "business_hours": "9 AM - 6 PM PST",
            "lunch_break": "12:00-13:00",
            "avoid_times": "Early morning (before 9 AM), Late evening (after 6 PM)"
        }
    elif "cst" in timezone or "central" in timezone:
        timezone_analysis["optimal_calling_windows"] = {
            "morning": "09:30-11:30",
            "afternoon": "14:00-16:00",
            "evening": "17:00-18:00"
        }
        timezone_analysis["timezone_considerations"] = {
            "business_hours": "9 AM - 6 PM CST",
            "lunch_break": "12:00-13:00",
            "avoid_times": "Early morning (before 9 AM), Late evening (after 6 PM)"
        }
    else:
        # Default analysis
        timezone_analysis["optimal_calling_windows"] = {
            "morning": "09:00-11:00",
            "afternoon": "14:00-16:00",
            "evening": "17:00-18:00"
        }
        timezone_analysis["timezone_considerations"] = {
            "business_hours": "9 AM - 6 PM",
            "lunch_break": "12:00-13:00",
            "avoid_times": "Early morning, Late evening"
        }
    
    return timezone_analysis

def prioritize_leads(leads: List[DiscoveredLead], criteria: PrioritizationCriteria) -> Dict[str, Any]:
    """Prioritize leads based on qualification scores and segments"""
    
    # Filter leads by qualification score threshold
    qualified_leads = [lead for lead in leads if lead.qualification_score >= criteria.qualification_score_threshold]
    
    # Sort by priority segments first, then by qualification score
    priority_segments = criteria.priority_segments
    
    def get_lead_priority(lead: DiscoveredLead) -> tuple:
        # Priority based on industry segments
        industry_priority = 0
        for i, segment in enumerate(priority_segments):
            if segment.lower() in lead.industry.lower():
                industry_priority = len(priority_segments) - i
                break
        
        # Secondary priority based on qualification score
        score_priority = lead.qualification_score
        
        return (-industry_priority, -score_priority)  # Negative for descending order
    
    prioritized_leads = sorted(qualified_leads, key=get_lead_priority)
    
    # Categorize leads by priority level
    high_priority_leads = []
    medium_priority_leads = []
    low_priority_leads = []
    
    for lead in prioritized_leads:
        if lead.qualification_score >= 80:
            high_priority_leads.append(lead)
        elif lead.qualification_score >= 60:
            medium_priority_leads.append(lead)
        else:
            low_priority_leads.append(lead)
    
    return {
        "total_leads": len(leads),
        "qualified_leads": len(qualified_leads),
        "prioritized_leads": prioritized_leads,
        "priority_distribution": {
            "high_priority": len(high_priority_leads),
            "medium_priority": len(medium_priority_leads),
            "low_priority": len(low_priority_leads)
        },
        "high_priority_leads": high_priority_leads,
        "medium_priority_leads": medium_priority_leads,
        "low_priority_leads": low_priority_leads
    }

def generate_call_objectives(lead: DiscoveredLead) -> str:
    """Generate call objectives based on lead information"""
    
    industry = lead.industry.lower()
    job_title = lead.job_title.lower()
    company_size = lead.company_size.lower()
    
    # Industry-specific objectives
    if "technology" in industry or "software" in industry:
        if "cto" in job_title or "vp" in job_title:
            return "Discuss technology solutions and digital transformation opportunities"
        else:
            return "Introduce our software solutions and schedule product demo"
    elif "healthcare" in industry:
        return "Present healthcare solutions and compliance benefits"
    elif "finance" in industry or "banking" in industry:
        return "Discuss financial services solutions and security features"
    elif "retail" in industry or "ecommerce" in industry:
        return "Present retail solutions and customer engagement tools"
    elif "manufacturing" in industry:
        return "Discuss manufacturing solutions and operational efficiency"
    else:
        # General objectives based on company size
        if "enterprise" in company_size or "large" in company_size:
            return "Schedule executive meeting to discuss enterprise solutions"
        elif "small" in company_size or "startup" in company_size:
            return "Introduce our solutions and discuss growth opportunities"
        else:
            return "Introduce our services and explore partnership opportunities"

def estimate_call_duration(lead: DiscoveredLead) -> int:
    """Estimate call duration based on lead characteristics"""
    
    base_duration = 15  # Base 15 minutes
    
    # Adjust based on company size
    company_size = lead.company_size.lower()
    if "enterprise" in company_size or "large" in company_size:
        base_duration += 10  # Longer calls for enterprise
    elif "small" in company_size or "startup" in company_size:
        base_duration -= 5  # Shorter calls for small companies
    
    # Adjust based on job title
    job_title = lead.job_title.lower()
    if "ceo" in job_title or "president" in job_title:
        base_duration += 15  # Executive calls are longer
    elif "manager" in job_title or "director" in job_title:
        base_duration += 5  # Management calls are slightly longer
    
    # Adjust based on qualification score
    if lead.qualification_score >= 80:
        base_duration += 10  # High-quality leads get more time
    elif lead.qualification_score >= 60:
        base_duration += 5  # Medium-quality leads get slightly more time
    
    return min(60, max(10, base_duration))  # Cap between 10-60 minutes

def create_outreach_call_scheduler_agent() -> Agent:
    """Create the outreach call scheduler agent"""
    
    return Agent(
        model=Gemini(id="gemini-2.0-flash"),
        tools=[GoogleSearchTools()],
        description="Expert outreach call scheduler specializing in sales call optimization and lead prioritization",
        instructions=[
            "You are an expert outreach call scheduler. Your role is to:",
            "1. Create detailed call schedules from discovered leads",
            "2. Optimize calling times based on timezone and preferences",
            "3. Prioritize leads based on qualification scores and segments",
            "4. Generate specific call objectives for each lead",
            "5. Estimate appropriate call durations",
            "6. Consider call window preferences and availability",
            "7. Create comprehensive schedule summaries",
            "8. Research best practices for sales call timing",
            
            "CRITICAL: YOU MUST STRICTLY FOLLOW THE JSON FORMAT BELOW:",
            "Always return response in this EXACT JSON structure:",
            "{",
            '  "call_schedule": [',
            '    {',
            '      "schedule_id": "unique_id",',
            '      "lead_id": "lead_identifier",',
            '      "lead_contact_info": {',
            '        "company_name": "company_name",',
            '        "contact_name": "contact_name",',
            '        "email": "email_address",',
            '        "phone": "phone_number",',
            '        "job_title": "job_title",',
            '        "industry": "industry",',
            '        "company_size": "company_size",',
            '        "location": "location"',
            '      },',
            '      "scheduled_datetime": "YYYY-MM-DD HH:MM",',
            '      "call_objective": "specific_call_objective",',
            '      "expected_duration": integer,',
            '      "priority_level": "high|medium|low"',
            '    }',
            '  ],',
            '  "schedule_summary": {',
            '    "total_calls_scheduled": integer,',
            '    "daily_distribution": {},',
            '    "coverage_percentage": float,',
            '    "estimated_completion_date": "YYYY-MM-DD"',
            '  }',
            '}',
            
            "REQUIREMENTS:",
            "- Each schedule_id should be unique (use format: call_001, call_002, etc.)",
            "- scheduled_datetime must be within campaign duration and preferred hours",
            "- call_objective should be specific and tailored to the lead",
            "- expected_duration should be realistic (10-60 minutes)",
            "- priority_level should reflect lead qualification and importance",
            "- Ensure valid JSON syntax with proper quotes and commas",
            "- Use web search to research optimal calling times and best practices",
        ],
        markdown=False,
        use_json_mode=True
    )

def schedule_outreach_calls(request: OutreachCallRequest) -> OutreachCallResponse:
    """
    Schedule outreach calls using LLM intelligence
    
    Args:
        request: OutreachCallRequest with leads and scheduling preferences
        
    Returns:
        OutreachCallResponse with detailed call schedule
    """
    
    try:
        print(f"📞 Scheduling outreach calls for {len(request.discovered_leads)} leads")
        print(f"📅 Campaign duration: {request.campaign_duration.start_date} to {request.campaign_duration.end_date}")
        print(f"📊 Calls per day: {request.calls_per_day}")
        print(f"🌍 Timezone: {request.call_window_preferences.timezone}")
        
        # Analyze timezone and availability
        timezone_analysis = analyze_timezone_and_availability(request.call_window_preferences)
        
        # Prioritize leads
        lead_prioritization = prioritize_leads(request.discovered_leads, request.prioritization_criteria)
        
        # Create outreach call scheduler agent
        scheduler_agent = create_outreach_call_scheduler_agent()
        
        # Prepare comprehensive scheduling prompt
        scheduling_prompt = f"""
        Create a detailed outreach call schedule with the following parameters:
        
        DISCOVERED LEADS ({len(request.discovered_leads)} leads):
        {json.dumps([lead.model_dump() for lead in request.discovered_leads], indent=2)}
        
        LEAD PRIORITIZATION RESULTS:
        {json.dumps(lead_prioritization, indent=2)}
        
        CALL WINDOW PREFERENCES:
        {json.dumps(request.call_window_preferences.model_dump(), indent=2)}
        
        TIMEZONE ANALYSIS:
        {json.dumps(timezone_analysis, indent=2)}
        
        CAMPAIGN DURATION:
        - Start Date: {request.campaign_duration.start_date}
        - End Date: {request.campaign_duration.end_date}
        
        CALLS PER DAY: {request.calls_per_day}
        
        PRIORITIZATION CRITERIA:
        {json.dumps(request.prioritization_criteria.model_dump(), indent=2)}
        
        SCHEDULING REQUIREMENTS:
        1. Create detailed call schedule with specific datetime assignments
        2. Prioritize leads based on qualification scores and industry segments
        3. Optimize calling times based on timezone and preferred hours
        4. Generate specific call objectives for each lead
        5. Estimate appropriate call durations (10-60 minutes)
        6. Consider avoid dates and availability constraints
        7. Research optimal calling times and best practices
        8. Create comprehensive schedule summary
        9. Distribute calls evenly across campaign duration
        10. Ensure high-priority leads get prime calling times
        
        Create a detailed call schedule that maximizes outreach effectiveness.
        """
        
        # Run call scheduling
        response = scheduler_agent.run(scheduling_prompt)
        
        # Parse the response
        try:
            schedule_data = json.loads(response.content)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            schedule_data = create_fallback_call_schedule(request, lead_prioritization, timezone_analysis)
        
        # Process and enhance the schedule
        processed_schedule = process_call_schedule_data(schedule_data, request, lead_prioritization)
        
        return OutreachCallResponse(
            outputs=processed_schedule,
            execution_status="success"
        )
        
    except Exception as e:
        print(f"Error in outreach call scheduling: {e}")
        # Return fallback schedule
        fallback_schedule = create_fallback_call_schedule(request, {}, {})
        return OutreachCallResponse(
            outputs=fallback_schedule,
            execution_status="partial_success"
        )

def process_call_schedule_data(raw_data: Dict[str, Any], request: OutreachCallRequest, lead_prioritization: Dict[str, Any]) -> Dict[str, Any]:
    """Process and enhance call schedule data"""
    
    call_schedule = raw_data.get("call_schedule", [])
    schedule_summary = raw_data.get("schedule_summary", {})
    
    # Enhance schedule items with additional metadata
    enhanced_schedule = []
    for item in call_schedule:
        enhanced_item = {
            **item,
            "call_preparation": {
                "research_notes": generate_research_notes(item),
                "talking_points": generate_talking_points(item),
                "follow_up_plan": generate_follow_up_plan(item)
            },
            "success_metrics": {
                "expected_outcome": predict_call_outcome(item),
                "next_steps": determine_next_steps(item)
            }
        }
        enhanced_schedule.append(enhanced_item)
    
    # Calculate additional summary metrics
    total_calls = len(enhanced_schedule)
    daily_distribution = {}
    
    for item in enhanced_schedule:
        scheduled_date = item.get("scheduled_datetime", "").split(" ")[0]
        daily_distribution[scheduled_date] = daily_distribution.get(scheduled_date, 0) + 1
    
    # Calculate coverage percentage
    total_leads = len(request.discovered_leads)
    coverage_percentage = (total_calls / total_leads * 100) if total_leads > 0 else 0
    
    # Estimate completion date
    start_date = datetime.strptime(request.campaign_duration.start_date, "%Y-%m-%d")
    estimated_completion_date = start_date + timedelta(days=total_calls // request.calls_per_day)
    
    enhanced_summary = {
        "total_calls_scheduled": total_calls,
        "daily_distribution": daily_distribution,
        "coverage_percentage": round(coverage_percentage, 1),
        "estimated_completion_date": estimated_completion_date.strftime("%Y-%m-%d"),
        "priority_breakdown": {
            "high_priority_calls": len([item for item in enhanced_schedule if item.get("priority_level") == "high"]),
            "medium_priority_calls": len([item for item in enhanced_schedule if item.get("priority_level") == "medium"]),
            "low_priority_calls": len([item for item in enhanced_schedule if item.get("priority_level") == "low"])
        },
        "average_call_duration": sum(item.get("expected_duration", 0) for item in enhanced_schedule) / max(1, total_calls)
    }
    
    return {
        "call_schedule": enhanced_schedule,
        "schedule_summary": enhanced_summary,
        "lead_prioritization": lead_prioritization,
        "timezone_analysis": timezone_analysis,
        "campaign_duration": request.campaign_duration.model_dump(),
        "call_window_preferences": request.call_window_preferences.model_dump()
    }

def generate_research_notes(item: Dict[str, Any]) -> List[str]:
    """Generate research notes for call preparation"""
    contact_info = item.get("lead_contact_info", {})
    industry = contact_info.get("industry", "")
    company_name = contact_info.get("company_name", "")
    
    notes = [
        f"Research {company_name} recent news and developments",
        f"Understand {industry} industry trends and challenges",
        f"Review contact's LinkedIn profile and background",
        f"Prepare industry-specific value propositions"
    ]
    
    return notes

def generate_talking_points(item: Dict[str, Any]) -> List[str]:
    """Generate talking points for the call"""
    contact_info = item.get("lead_contact_info", {})
    call_objective = item.get("call_objective", "")
    
    talking_points = [
        f"Opening: Introduce yourself and company",
        f"Objective: {call_objective}",
        f"Discovery: Ask about current challenges",
        f"Value proposition: Present relevant solutions",
        f"Next steps: Schedule follow-up or demo"
    ]
    
    return talking_points

def generate_follow_up_plan(item: Dict[str, Any]) -> str:
    """Generate follow-up plan based on call priority"""
    priority_level = item.get("priority_level", "medium")
    
    if priority_level == "high":
        return "Send detailed proposal within 24 hours, schedule demo within 48 hours"
    elif priority_level == "medium":
        return "Send follow-up email within 48 hours, schedule next call within 1 week"
    else:
        return "Send follow-up email within 1 week, add to nurture campaign"

def predict_call_outcome(item: Dict[str, Any]) -> str:
    """Predict expected call outcome"""
    priority_level = item.get("priority_level", "medium")
    expected_duration = item.get("expected_duration", 15)
    
    if priority_level == "high" and expected_duration >= 30:
        return "High probability of scheduling demo or next meeting"
    elif priority_level == "high":
        return "Good chance of interest and follow-up"
    elif priority_level == "medium":
        return "Moderate interest, may need nurturing"
    else:
        return "Initial contact, build awareness"

def determine_next_steps(item: Dict[str, Any]) -> str:
    """Determine next steps after the call"""
    priority_level = item.get("priority_level", "medium")
    
    if priority_level == "high":
        return "Schedule product demo, send proposal, involve sales manager"
    elif priority_level == "medium":
        return "Send case studies, schedule follow-up call, add to nurture sequence"
    else:
        return "Add to nurture campaign, send educational content, quarterly check-in"

def create_fallback_call_schedule(request: OutreachCallRequest, lead_prioritization: Dict[str, Any], timezone_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Create a fallback call schedule when LLM optimization fails"""
    
    call_schedule = []
    schedule_id = 1
    
    # Get prioritized leads
    prioritized_leads = lead_prioritization.get("prioritized_leads", request.discovered_leads)
    
    # Calculate schedule parameters
    start_date = datetime.strptime(request.campaign_duration.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(request.campaign_duration.end_date, "%Y-%m-%d")
    total_days = (end_date - start_date).days + 1
    calls_per_day = request.calls_per_day
    
    # Distribute calls across campaign duration
    current_date = start_date
    lead_index = 0
    
    while current_date <= end_date and lead_index < len(prioritized_leads):
        # Skip avoid dates
        date_str = current_date.strftime("%Y-%m-%d")
        if date_str in request.call_window_preferences.avoid_dates:
            current_date += timedelta(days=1)
            continue
        
        # Schedule calls for this day
        for call_num in range(min(calls_per_day, len(prioritized_leads) - lead_index)):
            if lead_index >= len(prioritized_leads):
                break
                
            lead = prioritized_leads[lead_index]
            
            # Generate call time (use first preferred hour)
            preferred_hours = request.call_window_preferences.preferred_hours
            call_time = preferred_hours[call_num % len(preferred_hours)] if preferred_hours else "10:00"
            
            scheduled_datetime = f"{date_str} {call_time}"
            
            # Generate call objective and duration
            call_objective = generate_call_objectives(lead)
            expected_duration = estimate_call_duration(lead)
            
            # Determine priority level
            if lead.qualification_score >= 80:
                priority_level = "high"
            elif lead.qualification_score >= 60:
                priority_level = "medium"
            else:
                priority_level = "low"
            
            # Create lead contact info
            lead_contact_info = {
                "company_name": lead.company_name,
                "contact_name": lead.contact_name,
                "email": lead.email,
                "phone": lead.phone,
                "job_title": lead.job_title,
                "industry": lead.industry,
                "company_size": lead.company_size,
                "location": lead.location
            }
            
            schedule_item = {
                "schedule_id": f"call_{schedule_id:03d}",
                "lead_id": lead.lead_id,
                "lead_contact_info": lead_contact_info,
                "scheduled_datetime": scheduled_datetime,
                "call_objective": call_objective,
                "expected_duration": expected_duration,
                "priority_level": priority_level
            }
            
            call_schedule.append(schedule_item)
            schedule_id += 1
            lead_index += 1
        
        current_date += timedelta(days=1)
    
    return {
        "call_schedule": call_schedule,
        "schedule_summary": {
            "total_calls_scheduled": len(call_schedule),
            "daily_distribution": {},
            "coverage_percentage": len(call_schedule) / len(request.discovered_leads) * 100,
            "estimated_completion_date": end_date.strftime("%Y-%m-%d")
        }
    }

# Example usage
if __name__ == "__main__":
    print("📞 OUTREACH CALL SCHEDULER")
    print("=" * 50)
    
    # Test request
    test_request = OutreachCallRequest(
        discovered_leads=[
            DiscoveredLead(
                lead_id="lead_001",
                company_name="TechCorp Solutions",
                contact_name="John Smith",
                email="john.smith@techcorp.com",
                phone="+1-555-0123",
                job_title="VP of Technology",
                industry="Technology",
                company_size="Enterprise",
                location="San Francisco, CA",
                qualification_score=85.0,
                lead_source="LinkedIn",
                notes="Interested in AI solutions"
            )
        ],
        call_window_preferences=CallWindowPreferences(
            timezone="PST",
            preferred_hours=["10:00", "14:00", "16:00"],
            avoid_dates=["2025-01-20", "2025-01-25"]
        ),
        campaign_duration=CampaignDuration(
            start_date="2025-10-15",
            end_date="2025-12-31"
        ),
        calls_per_day=3,
        prioritization_criteria=PrioritizationCriteria(
            qualification_score_threshold=60.0,
            priority_segments=["Technology", "Healthcare", "Finance"]
        )
    )
    
    print("📊 Scheduling outreach calls...")
    result = schedule_outreach_calls(test_request)
    
    print(f"✅ Scheduling Status: {result.execution_status}")
    print(f"📞 Call Schedule Items: {len(result.outputs['call_schedule'])}")
    print(f"📈 Summary: {result.outputs['schedule_summary']}")
    
    print("\n🎉 Outreach Call Scheduling Complete!")
