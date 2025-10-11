import requests
import time
import os
from dotenv import load_dotenv
from PIL import Image
from io import BytesIO
import base64

# Load environment variables
load_dotenv()

def generate_image(prompt, aspect_ratio="1:1", image_url="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=512", api_key="SG_b2bfa16423be7368", timeout=300):
    """
    Generate an image using Segmind API
    
    Args:
        prompt (str): Text description for image generation (used in aspect_ratio field)
        aspect_ratio (str): The user input string (this is where the prompt actually goes based on API docs)
        image_url (str): Required - publicly accessible image link for the workflow
        api_key (str): API key
        timeout (int): Maximum time to wait for image generation (seconds)
    
    Returns:
        str: URL of the generated image or None if failed
    """
    
    # API endpoint
    url = "https://api.segmind.com/workflows/6863c56b4727e611dfa21ad5-v2"
    
    # Based on the API docs, the structure should match exactly:
    # image: "publicly accessible image link" 
    # aspect_ratio: "the user input string" (this seems to be where the prompt goes)
    data = {
        "image": image_url,
        "aspect_ratio": prompt  # The prompt goes in aspect_ratio field based on API structure
    }
    
    # Headers
    headers = {
        'x-api-key': api_key,
        'Content-Type': 'application/json'
    }
    
    try:
        print(f"🎨 Generating image with prompt: '{prompt}'")
        print(f"🖼️ Base image: {image_url}")
        print(f"📡 Making request to: {url}")
        print(f"📋 Request data: {data}")
        
        # Make initial request
        response = requests.post(url, json=data, headers=headers)
        
        # Print detailed error information
        if not response.ok:
            print(f"❌ HTTP {response.status_code}: {response.reason}")
            print(f"📄 Response headers: {dict(response.headers)}")
            try:
                error_body = response.json()
                print(f"📄 Error response: {error_body}")
            except:
                print(f"📄 Raw response: {response.text}")
            return None
            
        response.raise_for_status()
        
        result = response.json()
        
        # Check if we got a poll_url (queued request)
        if "poll_url" in result:
            poll_url = result["poll_url"]
            request_id = result.get("request_id")
            
            print(f"⏳ Request queued with ID: {request_id}")
            print("🔄 Polling for completion...")
            
            # Poll for completion
            start_time = time.time()
            while time.time() - start_time < timeout:
                poll_response = requests.get(poll_url, headers=headers)
                poll_response.raise_for_status()
                
                poll_result = poll_response.json()
                
                if "output_image" in poll_result:
                    image_url = poll_result["output_image"]
                    print(f"✅ Image generated successfully!")
                    print(f"🖼️ Image URL: {image_url}")
                    return image_url
                
                elif poll_result.get("status") == "FAILED":
                    print("❌ Image generation failed")
                    return None
                
                # Wait before next poll
                time.sleep(5)
                print("⏳ Still processing...")
            
            print("⏰ Timeout reached while waiting for image generation")
            return None
            
        # Direct response with image
        elif "output_image" in result:
            image_url = result["output_image"]
            print(f"✅ Image generated successfully!")
            print(f"🖼️ Image URL: {image_url}")
            return image_url
        
        else:
            print("❌ Unexpected response format")
            print(f"Response: {result}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def download_and_show_image(image_url):
    """
    Download and display the generated image
    
    Args:
        image_url (str): URL of the image to download and display
    """
    try:
        print(f"📥 Downloading image from: {image_url}")
        response = requests.get(image_url)
        response.raise_for_status()
        
        # Open and display image
        image = Image.open(BytesIO(response.content))
        image.show()
        
        # Save image locally
        filename = f"generated_image_{int(time.time())}.png"
        image.save(filename)
        print(f"💾 Image saved as: {filename}")
        
        return filename
        
    except Exception as e:
        print(f"❌ Error downloading image: {e}")
        return None

# Example usage and testing
if __name__ == "__main__":
    # Test the function
    test_prompt = "A futuristic robot holding a red skateboard in a cyberpunk city"
    
    # Generate image (prompt goes in the first parameter, base image is required)
    image_url = generate_image(
        prompt=test_prompt,
        image_url="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=512"  # Base image for transformation
    )
    
    # Download and show the image if generation was successful
    if image_url:
        download_and_show_image(image_url)
    else:
        print("❌ Failed to generate image")
        
    # Example with different prompts
    print("\n" + "="*50)
    print("🎨 More Examples:")
    print("="*50)
    
    examples = [
        {
            "prompt": "A magical forest with glowing mushrooms and fireflies",
            "image_url": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=512"
        },
        {
            "prompt": "A modern coffee shop interior with plants and warm lighting", 
            "image_url": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=512"
        },
        {
            "prompt": "A cute cartoon cat wearing sunglasses",
            "image_url": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=512"
        }
    ]
    
    for i, example in enumerate(examples, 1):
        print(f"\nExample {i}: {example['prompt']}")
        print(f"Base image: {example['image_url']}")
        # Uncomment the line below to generate all examples
        # generate_image(example['prompt'], image_url=example['image_url'])