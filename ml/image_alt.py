import requests
import time
import os
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO

# Load environment variables
load_dotenv()

def generate_image_alt(prompt, api_key="SG_b2bfa16423be7368"):
    """
    Alternative approach using a different Segmind endpoint
    """
    
    # Try different common Segmind endpoints
    endpoints_to_try = [
        "https://api.segmind.com/v1/sd1.5-txt2img",
        "https://api.segmind.com/v1/sdxl1.0-txt2img", 
        "https://api.segmind.com/v1/playground-v2-txt2img"
    ]
    
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }
    
    for endpoint in endpoints_to_try:
        try:
            print(f"🔄 Trying endpoint: {endpoint}")
            
            data = {
                "prompt": prompt,
                "negative_prompt": "blurry, bad quality, low resolution",
                "style": "enhance",
                "samples": 1,
                "width": 512,
                "height": 512,
                "steps": 20,
                "guidance_scale": 7.5,
                "seed": 42,
                "scheduler": "UniPC"
            }
            
            response = requests.post(endpoint, json=data, headers=headers)
            
            if response.ok:
                print(f"✅ Success with {endpoint}")
                
                # Handle different response formats
                if response.headers.get('content-type', '').startswith('image/'):
                    # Direct image response
                    filename = f"generated_image_{int(time.time())}.png"
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    print(f"💾 Image saved as: {filename}")
                    
                    # Display image
                    image = Image.open(BytesIO(response.content))
                    image.show()
                    return filename
                else:
                    # JSON response with image URL
                    result = response.json()
                    print(f"📄 Response: {result}")
                    if 'image' in result:
                        return result['image']
                    elif 'images' in result and len(result['images']) > 0:
                        return result['images'][0]
            else:
                print(f"❌ Failed with {endpoint}: {response.status_code} - {response.text[:200]}")
                
        except Exception as e:
            print(f"❌ Error with {endpoint}: {e}")
            continue
    
    print("❌ All endpoints failed")
    return None

# Test both approaches
if __name__ == "__main__":
    prompt = "A futuristic robot holding a red skateboard in a cyberpunk city"
    
    print("🚀 Testing alternative Segmind endpoints...")
    result = generate_image_alt(prompt)
    
    if result:
        print(f"✅ Generated image: {result}")
    else:
        print("❌ All attempts failed")