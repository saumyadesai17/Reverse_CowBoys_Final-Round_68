from agno.agent import Agent
from agno.tools.googlesearch import GoogleSearchTools
from agno.models.google import Gemini
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

class CollaboratorNames(BaseModel):
    names: List[str]

def find_collaborators(
    search_criteria: Dict[str, Any],
    audience_segments: Optional[List[Dict[str, Any]]] = None,
    data_sources: List[str] = ["linkedin", "web_scraping"]
) -> List[str]:
    """
    Finds collaborators, celebrities, or influencers for social media campaigns.
    
    Args:
        search_criteria: Dict with industry, company_size, job_titles, location
        audience_segments: Optional audience segments from audience analyzer
        data_sources: List of data sources to search from
        
    Returns:
        List[str]: Array of collaborator/influencer names
    """
    
    agent = Agent(
        model=Gemini(id="gemini-2.0-flash"),
        tools=[GoogleSearchTools()],
        description="Find collaborators, celebrities, and influencers for social media campaigns.",
        instructions=[
            "Find potential collaborators, celebrities, or influencers for social media campaigns.",
            "Search for people who are active on social media and have influence in the specified industry.",
            "Return ONLY a list of names of potential collaborators.",
            "Focus on finding influencers, content creators, celebrities, and industry experts.",
            "Look across platforms: Instagram, TikTok, YouTube, LinkedIn, Twitter.",
            "Prioritize people with authentic engagement and good follower counts."
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
    
    if hasattr(response, 'names'):
        return response.names
    else:
        return []

# Simple test function
def test_agent():
    search_criteria = {
        "industry": ["Technology", "Gaming"],
        "company_size": "Medium",
        "job_titles": ["Content Creator", "Influencer"],
        "location": "United States"
    }
    
    collaborators = find_collaborators(search_criteria)
    print("Found collaborators:", collaborators)
    return collaborators

if __name__ == "__main__":
    test_agent()