"""Please install dependencies using:
pip install openai exa-py agno firecrawl
"""

from datetime import datetime, timedelta
from textwrap import dedent
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.exa import ExaTools
from agno.tools.firecrawl import FirecrawlTools
import os 
from dotenv import load_dotenv
load_dotenv()
os.environ["GOOGLE_API_KEY"] = "AIzaSyDH984JnVvIFTiWkbFKQ2ySE2iQcPMvB_0"
os.environ["EXA_API_KEY"] = os.getenv("EXA_API_KEY")


def calculate_start_date(days: int) -> str:
    """Calculate start date based on number of days."""
    start_date = datetime.now() - timedelta(days=days)
    return start_date.strftime("%Y-%m-%d")


agent = Agent(
    model=Gemini(id="gemini-2.0-flash"),
    tools=[
        ExaTools(start_published_date=calculate_start_date(30), type="keyword"),
        FirecrawlTools(scrape=True),
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

# Example usage:
campaign_brief = """\
Launch a social media campaign for our new sustainable coffee brand targeting Gen Z in Mumbai for World Environment Day
"""

agent.print_response(campaign_brief, stream=True)

# Alternative campaign examples:
# 
# fitness_campaign = """\
# Create a social media campaign for a new fitness app targeting working professionals in Bangalore during New Year resolution season
# """
# 
# fashion_campaign = """\
# Plan a social media campaign for an eco-friendly fashion brand targeting millennial women in Delhi for Diwali season
# """
# 
# agent.print_response(fitness_campaign, stream=True)