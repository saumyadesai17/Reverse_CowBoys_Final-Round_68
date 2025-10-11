from google import genai
from google.genai import types
import os 
from dotenv import load_dotenv
load_dotenv()

# Set the correct environment variable name that the library expects
os.environ["GOOGLE_API_KEY"] ="AIzaSyDH984JnVvIFTiWkbFKQ2ySE2iQcPMvB_0"
client = genai.Client()

# Use text generation instead of image generation (free tier)
response = client.models.generate_content(
    model='gemini-2.0-flash-exp',
    contents='Create a detailed creative description of a robot holding a red skateboard, including visual details, colors, style, and mood'
)

print("🎨 Creative Image Description:")
print("=" * 50)
print(response.text)
print("=" * 50)