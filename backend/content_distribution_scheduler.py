"""
Content Distribution Scheduler Service
AI-powered content distribution scheduling that creates detailed posting schedules

This service takes optimized timelines and content assets to create specific posting schedules:
- Maps content assets to timeline slots
- Assigns specific copy and images to posting times
- Considers platform specifications and requirements
- Creates detailed posting parameters
- Provides comprehensive schedule summaries
"""

import json
import time
from datetime import datetime, timedelta
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
class OptimizedTimeline(BaseModel):
    timeline_slot_id: str = Field(..., description="Timeline slot identifier")
    scheduled_date: str = Field(..., description="Scheduled date (YYYY-MM-DD)")
    content_type: str = Field(..., description="Type of content")
    platform: str = Field(..., description="Target platform")
    target_segment: str = Field(..., description="Target audience segment")
    priority: List[str] = Field(..., description="Priority levels")
    optimal_time: str = Field(..., description="Optimal posting time")
    reasoning: str = Field(..., description="Scheduling reasoning")

class GeneratedCopy(BaseModel):
    copy_id: str = Field(..., description="Copy identifier")
    copy_text: str = Field(..., description="Copy text content")
    word_count: int = Field(..., description="Word count")
    hashtags: List[str] = Field(default_factory=list, description="Hashtags")
    emojis: List[str] = Field(default_factory=list, description="Emojis")

class GeneratedImage(BaseModel):
    image_id: str = Field(..., description="Image identifier")
    image_url: str = Field(..., description="Image URL")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Image metadata")

class PlatformSpecifications(BaseModel):
    platform_name: str = Field(..., description="Platform name")
    max_caption_length: int = Field(..., description="Maximum caption length")
    supported_formats: List[str] = Field(..., description="Supported content formats")
    aspect_ratio_requirements: str = Field(..., description="Aspect ratio requirements")

class ContentDistributionRequest(BaseModel):
    optimized_timeline: List[OptimizedTimeline] = Field(..., description="Optimized timeline from campaign_timeline_optimizer")
    generated_copies: List[GeneratedCopy] = Field(..., description="Generated copies from copy_content_generator")
    generated_images: Optional[List[GeneratedImage]] = Field(None, description="Generated images from visual_asset_generator")
    video_url: Optional[str] = Field(None, description="Video URL from video_content_generator")
    platform_specifications: PlatformSpecifications = Field(..., description="Platform specifications")

# Output Models
class ContentPackage(BaseModel):
    copy_id: str = Field(..., description="Copy identifier")
    copy_text: str = Field(..., description="Copy text content")
    asset_ids: List[str] = Field(default_factory=list, description="Asset identifiers")
    asset_urls: List[str] = Field(default_factory=list, description="Asset URLs")

class PostingParameters(BaseModel):
    hashtags: List[str] = Field(default_factory=list, description="Hashtags")
    mentions: List[str] = Field(default_factory=list, description="Mentions")
    location_tag: Optional[str] = Field(None, description="Location tag")

class DistributionScheduleItem(BaseModel):
    schedule_item_id: str = Field(..., description="Schedule item identifier")
    scheduled_datetime: str = Field(..., description="Scheduled datetime (YYYY-MM-DD HH:MM)")
    platform: str = Field(..., description="Platform")
    content_package: ContentPackage = Field(..., description="Content package")
    posting_parameters: PostingParameters = Field(..., description="Posting parameters")
    target_segment: str = Field(..., description="Target audience segment")

class ScheduleSummary(BaseModel):
    total_posts: int = Field(..., description="Total number of posts")
    posts_by_platform: Dict[str, int] = Field(..., description="Posts count by platform")
    campaign_coverage: Dict[str, Any] = Field(..., description="Campaign coverage metrics")

class ContentDistributionResponse(BaseModel):
    outputs: Dict[str, Any] = Field(..., description="Distribution schedule outputs")
    execution_status: str = Field(..., description="Execution status")

def analyze_platform_requirements(platform_specs: PlatformSpecifications) -> Dict[str, Any]:
    """Analyze platform-specific requirements and constraints"""
    
    platform_name = platform_specs.platform_name.lower()
    
    platform_analysis = {
        "platform_name": platform_specs.platform_name,
        "max_caption_length": platform_specs.max_caption_length,
        "supported_formats": platform_specs.supported_formats,
        "aspect_ratio_requirements": platform_specs.aspect_ratio_requirements,
        "best_practices": {},
        "content_optimization": {}
    }
    
    if "instagram" in platform_name:
        platform_analysis["best_practices"] = {
            "hashtag_count": "5-10 hashtags optimal",
            "caption_style": "Engaging, visual-first content",
            "posting_times": "Morning (8-9 AM) and Evening (6-8 PM)",
            "content_mix": "70% visual, 30% text"
        }
        platform_analysis["content_optimization"] = {
            "image_priority": "High-quality, visually appealing images",
            "caption_optimization": "Hook in first line, call-to-action at end",
            "engagement_tactics": "Ask questions, use polls, encourage shares"
        }
    elif "facebook" in platform_name:
        platform_analysis["best_practices"] = {
            "hashtag_count": "1-3 hashtags maximum",
            "caption_style": "Informative, community-focused",
            "posting_times": "Midday (12-1 PM) and Evening (7-9 PM)",
            "content_mix": "60% text, 40% visual"
        }
        platform_analysis["content_optimization"] = {
            "image_priority": "Clear, informative images",
            "caption_optimization": "Detailed descriptions, community engagement",
            "engagement_tactics": "Encourage comments, shares, and discussions"
        }
    elif "linkedin" in platform_name:
        platform_analysis["best_practices"] = {
            "hashtag_count": "3-5 professional hashtags",
            "caption_style": "Professional, industry-focused",
            "posting_times": "Morning (8-9 AM) and Lunch (12-1 PM)",
            "content_mix": "80% text, 20% visual"
        }
        platform_analysis["content_optimization"] = {
            "image_priority": "Professional, data-driven visuals",
            "caption_optimization": "Industry insights, professional tone",
            "engagement_tactics": "Encourage professional discussions, networking"
        }
    else:
        # Default platform analysis
        platform_analysis["best_practices"] = {
            "hashtag_count": "3-7 hashtags",
            "caption_style": "Balanced, engaging content",
            "posting_times": "Peak hours vary by platform",
            "content_mix": "Balanced text and visual content"
        }
        platform_analysis["content_optimization"] = {
            "image_priority": "High-quality, relevant images",
            "caption_optimization": "Clear, engaging captions",
            "engagement_tactics": "Encourage interaction and sharing"
        }
    
    return platform_analysis

def match_content_to_timeline(timeline_slots: List[OptimizedTimeline], 
                            copies: List[GeneratedCopy], 
                            images: Optional[List[GeneratedImage]] = None) -> Dict[str, Any]:
    """Match content assets to timeline slots with unique image distribution"""
    
    content_matching = {
        "matched_slots": [],
        "unmatched_slots": [],
        "content_utilization": {
            "copies_used": 0,
            "images_used": 0,
            "total_copies": len(copies),
            "total_images": len(images) if images else 0
        }
    }
    
    # Create content pools by type
    copy_pools = {
        "social_caption": [copy for copy in copies if "social" in copy.copy_id.lower() or "caption" in copy.copy_id.lower()],
        "ad_copy": [copy for copy in copies if "ad" in copy.copy_id.lower()],
        "blog_post": [copy for copy in copies if "blog" in copy.copy_id.lower()],
        "email": [copy for copy in copies if "email" in copy.copy_id.lower()],
        "educational": [copy for copy in copies if "educational" in copy.copy_id.lower()],
        "general": copies  # Fallback pool
    }
    
    # Create available image pools (will be consumed as we assign them)
    available_images = list(images) if images else []
    used_image_ids = set()  # Track used images to ensure uniqueness
    
    for slot in timeline_slots:
        matched_content = {
            "slot": slot.model_dump(),
            "assigned_copy": None,
            "assigned_images": [],
            "matching_score": 0
        }
        
        # Match copy based on content type
        content_type = slot.content_type.lower()
        if content_type in copy_pools and copy_pools[content_type]:
            matched_content["assigned_copy"] = random.choice(copy_pools[content_type])
            matched_content["matching_score"] += 0.4
        else:
            # Use general pool
            if copy_pools["general"]:
                matched_content["assigned_copy"] = random.choice(copy_pools["general"])
                matched_content["matching_score"] += 0.2
        
        # Assign images with smart cycling when fewer images than posts
        platform = slot.platform.lower()
        assigned_images = []
        
        # Determine how many images to assign based on platform
        if "instagram" in platform or "facebook" in platform:
            max_images = 2  # Instagram/Facebook can handle multiple images
        else:
            max_images = 1  # LinkedIn and others typically uses single images
        
        if available_images:
            # First, try to assign unused images
            unused_images = [img for img in available_images if img.image_id not in used_image_ids]
            
            # If we have unused images, use them first
            if unused_images:
                images_to_assign = min(max_images, len(unused_images))
                assigned_images = unused_images[:images_to_assign]
                for img in assigned_images:
                    used_image_ids.add(img.image_id)
            else:
                # If all images have been used once, start cycling through them
                # Reset the used tracking and start over
                if len(used_image_ids) >= len(available_images):
                    # Calculate how many times we've cycled through all images
                    cycle_count = len([slot for slot in content_matching["matched_slots"] if slot["assigned_images"]])
                    
                    # Use modulo to cycle through available images
                    start_index = cycle_count % len(available_images)
                    images_to_assign = min(max_images, len(available_images))
                    
                    # Cycle through images starting from calculated index
                    for i in range(images_to_assign):
                        img_index = (start_index + i) % len(available_images)
                        assigned_images.append(available_images[img_index])
                else:
                    # Fallback: assign any available images
                    images_to_assign = min(max_images, len(available_images))
                    assigned_images = available_images[:images_to_assign]
        
        matched_content["assigned_images"] = assigned_images
        if assigned_images:
            matched_content["matching_score"] += 0.3
        
        if matched_content["assigned_copy"]:
            # Convert assigned_copy to dict for JSON serialization
            matched_content["assigned_copy"] = matched_content["assigned_copy"].model_dump()
            # Convert assigned_images to dicts for JSON serialization
            matched_content["assigned_images"] = [img.model_dump() for img in matched_content["assigned_images"]]
            content_matching["matched_slots"].append(matched_content)
            content_matching["content_utilization"]["copies_used"] += 1
            content_matching["content_utilization"]["images_used"] += len(matched_content["assigned_images"])
        else:
            content_matching["unmatched_slots"].append(slot.model_dump())
    
    return content_matching

def create_distribution_scheduler_agent() -> Agent:
    """Create the content distribution scheduler agent"""
    
    return Agent(
        model=Gemini(id="gemini-2.0-flash"),
        tools=[GoogleSearchTools()],
        description="Expert content distribution scheduler specializing in detailed posting schedules and platform optimization",
        instructions=[
            "You are an expert content distribution scheduler. Your role is to:",
            "1. Create detailed posting schedules from optimized timelines",
            "2. Match specific content assets (copy, images) to timeline slots",
            "3. Optimize content for platform-specific requirements",
            "4. Generate posting parameters (hashtags, mentions, location tags)",
            "5. Ensure content compliance with platform specifications",
            "6. Create comprehensive schedule summaries",
            "7. Research platform best practices for optimal engagement",
            
            "CRITICAL: YOU MUST STRICTLY FOLLOW THE JSON FORMAT BELOW:",
            "Always return response in this EXACT JSON structure:",
            "{",
            '  "distribution_schedule": [',
            '    {',
            '      "schedule_item_id": "unique_id",',
            '      "scheduled_datetime": "YYYY-MM-DD HH:MM",',
            '      "platform": "platform_name",',
            '      "content_package": {',
            '        "copy_id": "copy_identifier",',
            '        "copy_text": "optimized_copy_text",',
            '        "asset_ids": ["asset_id_1", "asset_id_2"],',
            '        "asset_urls": ["asset_url_1", "asset_url_2"]',
            '      },',
            '      "posting_parameters": {',
            '        "hashtags": ["hashtag1", "hashtag2"],',
            '        "mentions": ["@mention1"],',
            '        "location_tag": "location_name"',
            '      },',
            '      "target_segment": "audience_segment"',
            '    }',
            '  ],',
            '  "schedule_summary": {',
            '    "total_posts": integer,',
            '    "posts_by_platform": {},',
            '    "campaign_coverage": {',
            '      "timeline_coverage": "percentage",',
            '      "content_utilization": "percentage",',
            '      "platform_distribution": "balanced|focused"',
            '    }',
            '  }',
            '}',
            
            "REQUIREMENTS:",
            "- Each schedule_item_id should be unique (use format: post_001, post_002, etc.)",
            "- scheduled_datetime must combine date and optimal_time from timeline",
            "- copy_text should be optimized for platform specifications",
            "- asset_ids and asset_urls should match assigned content",
            "- hashtags should be platform-appropriate and relevant",
            "- mentions should be relevant to the content and audience",
            "- location_tag should be relevant to the target segment",
            "- Ensure valid JSON syntax with proper quotes and commas",
            "- Use web search to research platform best practices",
        ],
        markdown=False,
        use_json_mode=True
    )

def schedule_content_distribution(request: ContentDistributionRequest) -> ContentDistributionResponse:
    """
    Schedule content distribution using LLM intelligence
    
    Args:
        request: ContentDistributionRequest with timeline and content assets
        
    Returns:
        ContentDistributionResponse with detailed posting schedule
    """
    
    try:
        print(f"📅 Scheduling content distribution for {len(request.optimized_timeline)} timeline slots")
        print(f"📝 Available copies: {len(request.generated_copies)}")
        print(f"🖼️ Available images: {len(request.generated_images) if request.generated_images else 0}")
        
        # Analyze platform requirements
        platform_analysis = analyze_platform_requirements(request.platform_specifications)
        
        # Match content to timeline slots
        content_matching = match_content_to_timeline(
            request.optimized_timeline,
            request.generated_copies,
            request.generated_images
        )
        
        # Create distribution scheduler agent
        scheduler_agent = create_distribution_scheduler_agent()
        
        # Prepare comprehensive scheduling prompt
        scheduling_prompt = f"""
        Create a detailed content distribution schedule with the following parameters:
        
        OPTIMIZED TIMELINE ({len(request.optimized_timeline)} slots):
        {json.dumps([slot.model_dump() for slot in request.optimized_timeline], indent=2)}
        
        CONTENT MATCHING RESULTS:
        {json.dumps(content_matching, indent=2)}
        
        GENERATED COPIES ({len(request.generated_copies)} copies):
        {json.dumps([copy.model_dump() for copy in request.generated_copies], indent=2)}
        
        GENERATED IMAGES ({len(request.generated_images) if request.generated_images else 0} images):
        {json.dumps([img.model_dump() for img in request.generated_images] if request.generated_images else [], indent=2)}
        
        PLATFORM SPECIFICATIONS:
        {json.dumps(request.platform_specifications.model_dump(), indent=2)}
        
        PLATFORM ANALYSIS:
        {json.dumps(platform_analysis, indent=2)}
        
        VIDEO URL: {request.video_url or "Not provided"}
        
        SCHEDULING REQUIREMENTS:
        1. Create detailed posting schedule with specific datetime assignments
        2. Match content assets to timeline slots optimally
        3. Optimize copy text for platform specifications (max {request.platform_specifications.max_caption_length} characters)
        4. Assign appropriate hashtags based on platform best practices
        5. Include relevant mentions and location tags
        6. Ensure content compliance with platform requirements
        7. Research current platform trends and best practices
        8. Create comprehensive schedule summary
        9. Optimize for target audience segments
        10. Balance content distribution across timeline
        
        Create a detailed distribution schedule that specifies exactly what content to post when.
        """
        
        # Run content distribution scheduling
        response = scheduler_agent.run(scheduling_prompt)
        
        # Parse the response
        try:
            schedule_data = json.loads(response.content)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            schedule_data = create_fallback_schedule(request, content_matching, platform_analysis)
        
        # Process and enhance the schedule
        processed_schedule = process_schedule_data(schedule_data, request, content_matching)
        
        return ContentDistributionResponse(
            outputs=processed_schedule,
            execution_status="success"
        )
        
    except Exception as e:
        print(f"Error in content distribution scheduling: {e}")
        # Return fallback schedule
        fallback_schedule = create_fallback_schedule(request, {}, {})
        return ContentDistributionResponse(
            outputs=fallback_schedule,
            execution_status="partial_success"
        )

def process_schedule_data(raw_data: Dict[str, Any], request: ContentDistributionRequest, content_matching: Dict[str, Any]) -> Dict[str, Any]:
    """Process and enhance schedule data"""
    
    distribution_schedule = raw_data.get("distribution_schedule", [])
    schedule_summary = raw_data.get("schedule_summary", {})
    
    # Enhance schedule items with additional metadata
    enhanced_schedule = []
    for item in distribution_schedule:
        enhanced_item = {
            **item,
            "content_optimization": {
                "platform_compliance": check_platform_compliance(item, request.platform_specifications),
                "engagement_score": calculate_engagement_score(item),
                "content_quality": assess_content_quality(item)
            },
            "execution_notes": generate_execution_notes(item, request.platform_specifications)
        }
        enhanced_schedule.append(enhanced_item)
    
    # Calculate additional summary metrics
    total_posts = len(enhanced_schedule)
    posts_by_platform = {}
    
    for item in enhanced_schedule:
        platform = item.get("platform", "unknown")
        posts_by_platform[platform] = posts_by_platform.get(platform, 0) + 1
    
    # Calculate campaign coverage
    timeline_coverage = len(enhanced_schedule) / len(request.optimized_timeline) * 100 if request.optimized_timeline else 0
    content_utilization = content_matching.get("content_utilization", {})
    utilization_percentage = (content_utilization.get("copies_used", 0) / max(1, content_utilization.get("total_copies", 1))) * 100
    
    enhanced_summary = {
        "total_posts": total_posts,
        "posts_by_platform": posts_by_platform,
        "campaign_coverage": {
            "timeline_coverage": f"{timeline_coverage:.1f}%",
            "content_utilization": f"{utilization_percentage:.1f}%",
            "platform_distribution": "balanced" if len(posts_by_platform) > 1 else "focused",
            "schedule_efficiency": f"{len(enhanced_schedule)}/{len(request.optimized_timeline)} slots scheduled"
        }
    }
    
    return {
        "distribution_schedule": enhanced_schedule,
        "schedule_summary": enhanced_summary,
        "platform_specifications": request.platform_specifications.dict(),
        "content_matching": content_matching,
        "platform_analysis": analyze_platform_requirements(request.platform_specifications)
    }

def check_platform_compliance(item: Dict[str, Any], platform_specs: PlatformSpecifications) -> Dict[str, Any]:
    """Check if content complies with platform specifications"""
    
    copy_text = item.get("content_package", {}).get("copy_text", "")
    hashtags = item.get("posting_parameters", {}).get("hashtags", [])
    
    compliance = {
        "caption_length": len(copy_text),
        "caption_within_limit": len(copy_text) <= platform_specs.max_caption_length,
        "hashtag_count": len(hashtags),
        "hashtag_appropriate": len(hashtags) <= 10,  # General best practice
        "overall_compliance": True
    }
    
    if not compliance["caption_within_limit"]:
        compliance["overall_compliance"] = False
    
    return compliance

def calculate_engagement_score(item: Dict[str, Any]) -> float:
    """Calculate predicted engagement score for a schedule item"""
    score = 0.5  # Base score
    
    # Hashtag boost
    hashtags = item.get("posting_parameters", {}).get("hashtags", [])
    if 3 <= len(hashtags) <= 7:
        score += 0.2
    
    # Content package boost
    content_package = item.get("content_package", {})
    if content_package.get("asset_urls"):
        score += 0.2
    
    # Copy text boost
    copy_text = content_package.get("copy_text", "")
    if len(copy_text) > 50:  # Substantial content
        score += 0.1
    
    return min(1.0, score)

def assess_content_quality(item: Dict[str, Any]) -> str:
    """Assess content quality based on available elements"""
    content_package = item.get("content_package", {})
    posting_params = item.get("posting_parameters", {})
    
    quality_score = 0
    
    # Copy text quality
    if content_package.get("copy_text"):
        quality_score += 1
    
    # Asset quality
    if content_package.get("asset_urls"):
        quality_score += 1
    
    # Hashtag quality
    if posting_params.get("hashtags"):
        quality_score += 1
    
    if quality_score >= 3:
        return "high"
    elif quality_score >= 2:
        return "medium"
    else:
        return "basic"

def generate_execution_notes(item: Dict[str, Any], platform_specs: PlatformSpecifications) -> List[str]:
    """Generate execution notes for a schedule item"""
    notes = []
    
    copy_text = item.get("content_package", {}).get("copy_text", "")
    hashtags = item.get("posting_parameters", {}).get("hashtags", [])
    
    if len(copy_text) > platform_specs.max_caption_length * 0.9:
        notes.append(f"Caption length ({len(copy_text)} chars) is close to platform limit ({platform_specs.max_caption_length} chars)")
    
    if len(hashtags) > 7:
        notes.append(f"Consider reducing hashtag count ({len(hashtags)}) for better engagement")
    
    if not item.get("content_package", {}).get("asset_urls"):
        notes.append("No visual assets assigned - consider adding images for better engagement")
    
    return notes

def create_fallback_schedule(request: ContentDistributionRequest, content_matching: Dict[str, Any], platform_analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Create a fallback schedule when LLM optimization fails"""
    
    distribution_schedule = []
    schedule_id = 1
    
    matched_slots = content_matching.get("matched_slots", [])
    
    for matched_slot in matched_slots:
        slot = matched_slot["slot"]
        assigned_copy = matched_slot["assigned_copy"]
        assigned_images = matched_slot["assigned_images"]
        
        if assigned_copy:
            # Create datetime from date and time
            scheduled_datetime = f"{slot['scheduled_date']} {slot['optimal_time']}"
            
            # Create content package
            asset_ids = [img["image_id"] for img in assigned_images] if assigned_images else []
            asset_urls = [img["image_url"] for img in assigned_images] if assigned_images else []
            
            # Only use actual asset URLs from visual asset generator
            # If no assets provided, we should not generate fallback dummy images
            if not asset_urls:
                print(f"⚠️ No visual assets provided for slot {schedule_id}. Consider running visual asset generator first.")
                asset_ids = []
            
            content_package = {
                "copy_id": assigned_copy["copy_id"],
                "copy_text": assigned_copy["copy_text"][:request.platform_specifications.max_caption_length],
                "asset_ids": asset_ids,
                "asset_urls": asset_urls
            }
            
            # Create posting parameters
            posting_parameters = {
                "hashtags": assigned_copy["hashtags"][:5],  # Limit hashtags
                "mentions": [],
                "location_tag": None
            }
            
            schedule_item = {
                "schedule_item_id": f"post_{schedule_id:03d}",
                "scheduled_datetime": scheduled_datetime,
                "platform": slot["platform"],
                "content_package": content_package,
                "posting_parameters": posting_parameters,
                "target_segment": slot["target_segment"]
            }
            
            distribution_schedule.append(schedule_item)
            schedule_id += 1
    
    return {
        "distribution_schedule": distribution_schedule,
        "schedule_summary": {
            "total_posts": len(distribution_schedule),
            "posts_by_platform": {},
            "campaign_coverage": {
                "timeline_coverage": f"{len(distribution_schedule)/len(request.optimized_timeline)*100:.1f}%",
                "content_utilization": "100%",
                "platform_distribution": "balanced"
            }
        }
    }

# Example usage
if __name__ == "__main__":
    print("📅 CONTENT DISTRIBUTION SCHEDULER")
    print("=" * 50)
    
    # Test request
    test_request = ContentDistributionRequest(
        optimized_timeline=[
            OptimizedTimeline(
                timeline_slot_id="slot_001",
                scheduled_date="2025-01-01",
                content_type="social_caption",
                platform="Instagram",
                target_segment="millennials",
                priority=["high"],
                optimal_time="09:00",
                reasoning="Optimal morning engagement"
            )
        ],
        generated_copies=[
            GeneratedCopy(
                copy_id="copy_001",
                copy_text="Check out our amazing new product! 🚀 #innovation #tech",
                word_count=8,
                hashtags=["innovation", "tech"],
                emojis=["🚀"]
            )
        ],
        generated_images=[
            GeneratedImage(
                image_id="img_001",
                image_url="https://example.com/image1.jpg",
                metadata={"style": "modern"}
            )
        ],
        platform_specifications=PlatformSpecifications(
            platform_name="Instagram",
            max_caption_length=2200,
            supported_formats=["image", "video"],
            aspect_ratio_requirements="1:1 or 4:5"
        )
    )
    
    print("📊 Scheduling content distribution...")
    result = schedule_content_distribution(test_request)
    
    print(f"✅ Scheduling Status: {result.execution_status}")
    print(f"📈 Schedule Items: {len(result.outputs['distribution_schedule'])}")
    print(f"🎯 Summary: {result.outputs['schedule_summary']}")
    
    print("\n🎉 Content Distribution Scheduling Complete!")
