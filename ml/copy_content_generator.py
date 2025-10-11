from agno.agent import Agent
from agno.models.google import Gemini
import os 
from dotenv import load_dotenv
from agno.tools.googlesearch import GoogleSearchTools
from pydantic import BaseModel, Field
from typing import List
import json
import re

load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv('GO_API_KEY')

def parse_json_from_response(response_text: str) -> dict:
    """
    Extract and parse JSON from markdown code blocks or plain text
    """
    try:
        # First try to parse as direct JSON
        return json.loads(response_text)
    except json.JSONDecodeError:
        # If that fails, try to extract JSON from markdown code blocks
        json_pattern = r'```json\s*(.*?)\s*```'
        match = re.search(json_pattern, response_text, re.DOTALL)
        if match:
            json_str = match.group(1)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
        
        # If still no luck, try to find JSON-like content
        json_pattern2 = r'\{.*\}'
        match2 = re.search(json_pattern2, response_text, re.DOTALL)
        if match2:
            json_str = match2.group(0)
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass
    
    # If all parsing fails, return error format
    return {
        "generated_copies": [{
            "copy_text": "Error parsing response",
            "copy_id": "error_001",
            "word_count": 0,
            "hashtags": [],
            "emojis": []
        }]
    }

# Structured output models
class GeneratedCopy(BaseModel):
    copy_text: str = Field(..., description="Generated content text")
    copy_id: str = Field(..., description="Unique identifier for the copy")
    word_count: int = Field(..., description="Actual word count of the generated content")
    hashtags: List[str] = Field(..., description="Best hashtags for the content")
    emojis: List[str] = Field(..., description="Best emojis for the content")

class ContentOutput(BaseModel):
    generated_copies: List[GeneratedCopy] = Field(..., description="List of generated content copies")


web_searcher = Agent(
    name="Web Searcher",
    model=Gemini(id="gemini-2.0-flash"),
    role="Searches the web for information on a topic",
    description="An intelligent agent that performs comprehensive web searches to gather current and accurate information",
    tools=[GoogleSearchTools()],
    instructions=[
        "1. Perform focused web searches using relevant keywords",
        "2. Filter results for credibility and recency",
        "3. Extract key information and main points",
        "4. Organize information in a logical structure",
        "5. Verify facts from multiple sources when possible",
        "6. Focus on authoritative and reliable sources",
    ],
)



post_team = Agent(
    team=[web_searcher],
    model=Gemini(id="gemini-2.0-flash"),
    instructions=[
        "Work together to create compelling ad copy and social media content",
        "Start by researching the topic, target audience, and market trends",
        "Create engaging ad posts that convert and drive action",
        "Focus on benefits, pain points, and call-to-actions",
        "Include relevant hashtags and emojis for social media optimization",
        
        "CRITICAL: YOU MUST STRICTLY FOLLOW THE JSON FORMAT BELOW:",
        "Always return response in this EXACT JSON structure:",
        "{",
        '  "generated_copies": [',
        '    {',
        '      "copy_text": "actual content text here",',
        '      "copy_id": "unique_id_here", ',
        '      "word_count": integer_number,',
        '      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],',
        '      "emojis": ["emoji1", "emoji2", "emoji3"]',
        '    }',
        '  ]',
        '}',
        
        "REQUIREMENTS:",
        "- Each copy_id should be unique (use format: content_type_v1, content_type_v2, etc.)",
        "- word_count must be exact integer count of words in copy_text",
        "- hashtags array should contain 5-8 relevant hashtags without # symbol",
        "- emojis array should contain 3-5 appropriate emojis",
        "- Do NOT include any text outside the JSON structure",
        "DONT INCLUDE ANYTHING BESIDE JSON OUTPUT OR YOU WILL BE TERMINATED .",
        "YOU ARE ONLY MADE TO GIVE JSON OUTPUT NOTHING ELSE",
        "- Ensure valid JSON syntax with proper quotes and commas",
    ],
    structured_outputs=ContentOutput,
    markdown=False,
    use_json_mode=True
)



def generate_social_content(
    content_type: str,           # "social_caption", "ad_copy", "blog_post", "email", "product_description"
    campaign_brief: str,         # Campaign context and objectives
    tone_of_voice: str,          # "professional", "casual", "humorous", "inspirational", "educational"
    target_audience: dict,       # demographics, psychographics, pain_points
    word_count_range: dict       # min and max word counts
):
    """
    Generate tailored marketing copy for various platforms.

    Args:
        content_type (str): Type of content to generate.
        campaign_brief (str): Brief description of the campaign.
        tone_of_voice (str): Desired tone of the content.
        target_audience (dict): Details about the target audience.
        word_count_range (dict): Minimum and maximum word counts.

    Returns:
        ContentOutput: Structured output containing generated copies.
    """
    response = post_team.run(
        f"Generate {content_type} for the following campaign brief: {campaign_brief}. "
        f"Use a {tone_of_voice} tone. Target audience details: {json.dumps(target_audience)}. "
        f"Word count should be between {word_count_range['min']} and {word_count_range['max']} words. "
    )
    
    # Parse the JSON from the response (handles markdown code blocks)
    parsed_response = parse_json_from_response(response.content)
    return parsed_response
    

# Test the function with proper parameters
if __name__ == "__main__":
    result = generate_social_content(
        content_type="social_caption",
        campaign_brief="Promote our new eco-friendly water bottle.",
        tone_of_voice="inspirational",
        target_audience={
            "demographics": "Ages 25-35, urban professionals", 
            "psychographics": "Health-conscious, environmentally aware",
            "pain_points": ["plastic waste", "health concerns", "staying hydrated"]
        },
        word_count_range={"min": 50, "max": 100}
    )
    print(json.dumps(result, indent=2,ensure_ascii=False))