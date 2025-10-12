from agno.agent import Agent
from agno.tools.googlesearch import GoogleSearchTools
from agno.models.google import Gemini
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import os
import json
import re
from dotenv import load_dotenv
from googleapiclient.discovery import build
load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GO_API_KEY")
CSE_ID = os.getenv("CSE_ID") 

API_KEY = os.getenv("API_KEY")
class CollaboratorNames(BaseModel):
    names: List[str]

def find_collaborators(
    search_criteria: Dict[str, Any],
    audience_segments: Optional[List[Dict[str, Any]]] = None,
    data_sources: List[str] = ["linkedin", "web_scraping"]
) -> Dict[str, List[str]]:
    """
    Finds collaborators, celebrities, or influencers for social media campaigns.
    
    Args:
        search_criteria: Dict with industry, company_size, job_titles, location
        audience_segments: Optional audience segments from audience analyzer
        data_sources: List of data sources to search from
        
    Returns:
        Dict[str, List[str]]: JSON object with array of collaborator/influencer names
    """
    
    agent = Agent(
        model=Gemini(id="gemini-2.0-flash"),
        tools=[GoogleSearchTools()],
        description="Find collaborators, celebrities, and influencers for social media campaigns.",
        instructions=[
            "Find potential collaborators, celebrities, or influencers for social media campaigns.",
            "Search for people who are active on social media and have influence in the specified industry.",
            "Return ONLY a list of names of  collaborators.",
            "These influencers can be from youtube, instagram , linkedin ,etc"
            "Focus on finding influencers, content creators, celebrities, and industry experts.",
            "Prioritize people with authentic engagement and good follower counts."
            "You just have to search for names of influencers and return them and you have to return some influencers",
            "You just have to return a list of names in the following format: {\"names\": [\"Name1\", \"Name2\", ...]}",
            "IF YOU DONT FOLLOW THIS JSON FORMAT STRICTLY YOU WILL BE TERMINATED"
            "JUST RETURN JSON NOTHING ELSE "
        ],
        debug_mode=True,
        structured_outputs=CollaboratorNames
    )
    
    # Build search query
    industry = ", ".join(search_criteria.get("industry", []))
    job_titles = ", ".join(search_criteria.get("job_titles", []))
    location = search_criteria.get("location", "")
    company_size = search_criteria.get("company_size", "")
    
    query = f"""
    Find influencers and collaborators in the {industry} industry 
    who work as {job_titles} 
    located in {location} 
    from {company_size} companies.
    
    Search using these platforms: {', '.join(data_sources)}
    
    Return a list of names of potential collaborators for social media campaigns.
    Focus on active social media users with good engagement.
    """
    
    response = agent.run(query)
    
    # Parse the response to extract JSON
    try:
        # If the response has the structured output
        if hasattr(response, 'names'):
            return {"names": response.names}
        
        # If response.content contains markdown-wrapped JSON
        content = response.content if hasattr(response, 'content') else str(response)
        
        # Extract JSON from markdown code blocks
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
            parsed_json = json.loads(json_str)
            return parsed_json
        
        # Try to parse the content directly as JSON
        try:
            parsed_json = json.loads(content)
            return parsed_json
        except:
            pass
        
        # If all else fails, return empty result
        return {"names": []}
        
    except Exception as e:
        print(f"Error parsing response: {e}")
        return {"names": []} 
def google_images(query, num=5):
    """Get image URLs from Google Custom Search"""
    try:
        service = build("customsearch", "v1", developerKey=API_KEY)
        res = service.cse().list(q=query, cx=CSE_ID, searchType="image", num=num).execute()
        return [item["link"] for item in res["items"]]
    except Exception as e:
        print(f"Error fetching images: {e}")
        return []

def fetch_collaborator_images(collaborator_names: List[str]) -> Dict[str, List[Dict[str, str]]]:
    """
    Fetches images for a list of collaborators using the google_images function.
    
    Args:
        collaborator_names: List of collaborator names
        
    Returns:
        Dict with list of collaborators containing name and image_link
    """
    collaborators = []
    
    for name in collaborator_names:
        try:
            # Use your google_images function to get image for each collaborator
            query = f"{name} influencer profile picture"
            image_urls = google_images(query, num=1)  # Get just 1 image per person
            
            if image_urls:
                image_link = image_urls[0]  # Take the first image
            else:
                image_link = ""  # No image found
            
            collaborators.append({
                "name": name,
                "image_link": image_link
            })
            
        except Exception as e:
            print(f"Error fetching image for {name}: {e}")
            collaborators.append({
                "name": name,
                "image_link": ""
            })
    
    return {"collaborators": collaborators}

def find_collaborators_with_images(
    search_criteria: Dict[str, Any],
    audience_segments: Optional[List[Dict[str, Any]]] = None,
    data_sources: List[str] = ["linkedin", "web_scraping"]
) -> Dict[str, List[Dict[str, str]]]:
    """
    Finds collaborators and fetches their images in one go.
    
    Args:
        search_criteria: Dict with industry, company_size, job_titles, location
        audience_segments: Optional audience segments from audience analyzer
        data_sources: List of data sources to search from
        
    Returns:
        Dict with list of collaborators containing name and image_link
    """
    
    # First, find collaborators
    collaborators_result = find_collaborators(search_criteria, audience_segments, data_sources)
    collaborator_names = collaborators_result.get("names", [])
    
    if not collaborator_names:
        return {"collaborators": []}
    
    # Then, fetch their images using your google_images function
    return fetch_collaborator_images(collaborator_names)
# Test functions
def test_agent():
    search_criteria = {
        "industry": ["Fashion"],
        "company_size": "Medium",
        "job_titles": ["Content Creator"],
        "location": "Mumbai"
    }
    
    print("=== Testing find_collaborators (names only) ===")
    collaborators = find_collaborators(search_criteria)
    print("Found collaborators:", json.dumps(collaborators, indent=2))
    
    print("\n=== Testing find_collaborators_with_images (names + images) ===")
    collaborators_with_images = find_collaborators_with_images(search_criteria)
    print("Collaborators with images:", json.dumps(collaborators_with_images, indent=2))
    
    return collaborators_with_images

def test_image_fetch_only():
    """Test image fetching with predefined names"""
    test_names = ["Masoom Minawala", "Aashna Shroff"]
    
    print("=== Testing fetch_collaborator_images (specific names) ===")
    result = fetch_collaborator_images(test_names)
    print("Images for specific names:", json.dumps(result, indent=2))
    
    return result

if __name__ == "__main__":
    test_agent()