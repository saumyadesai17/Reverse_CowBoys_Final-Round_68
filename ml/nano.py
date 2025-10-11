import json
import requests
import random

def run(args: dict) -> dict:
    """
    Generate an image using Pollinations open source URL.

    Args:
    - args (dict): A dictionary containing the image description, height, and width.
        - description (str): The description of the image to be generated.
        - height (int): The height of the image.
        - width (int): The width of the image.

    Returns:
    - dict: A dictionary containing the generated image URL.
    """

    # Check if the required parameters are present in the args dictionary
    required_params = ['description', 'height', 'width']
    for param in required_params:
        if param not in args:
            return {'error': f'Missing required parameter: {param}'}

    # Set default parameters
    default_params = {
        'num_inference_steps': 50,
        'guidance_scale': 7.5,
        'seed': 42
    }

    # Update the args dictionary with default parameters
    args.update({key: args.get(key, value) for key, value in default_params.items()})

    # Validate the height and width parameters
    if not isinstance(args['height'], int) or not isinstance(args['width'], int):
        return {'error': 'Height and width must be integers'}
    if args['height'] <= 0 or args['width'] <= 0:
        return {'error': 'Height and width must be positive integers'}

    # Set the API endpoint URL (Pollinations uses a simple GET endpoint)
    # Pollinations API doesn't require authentication and uses GET requests
    base_url = 'https://image.pollinations.ai/prompt'
    
    # Create the image URL with parameters
    prompt_encoded = requests.utils.quote(args['description'])
    image_url = f"{base_url}/{prompt_encoded}?width={args['width']}&height={args['height']}&seed={args['seed']}"
    
   
    
    # Test if the URL is accessible
    try:
        response = requests.head(image_url, timeout=30)
        if response.status_code == 200:
            return {'image_url': image_url}
        else:
            return {'error': f'Image generation failed with status code: {response.status_code}'}
    except requests.exceptions.RequestException as e:
        return {'error': f'Failed to access image URL: {str(e)}'}

    # Return the generated image URL
    return {'image_url': image_url}


def visual_asset_manager(prompt: str, quantity: int, image_types: str, dimension: dict) -> list:
    """
    Generate multiple images using the run function with different parameters.
    
    Args:
    - prompt (str): The base description for image generation
    - quantity (int): Number of images to generate
    - image_types (str): Type of images ('realistic' or 'cartoonish')
    - dimension (dict): Dictionary with 'height' and 'width' keys
    
    Returns:
    - list: List of image URLs or error messages
    """
    
    # Validate inputs
    if not isinstance(quantity, int) or quantity <= 0:
        return [{'error': 'Quantity must be a positive integer'}]
    
    if not isinstance(dimension, dict) or 'height' not in dimension or 'width' not in dimension:
        return [{'error': 'Dimension must be a dict with height and width keys'}]
    
    # Style modifiers based on image type
    style_modifiers = {
        'realistic': ', photorealistic, high quality, detailed, professional photography',
        'cartoonish': ', cartoon style, animated, colorful, fun, illustration, cartoon art'
    }
    
    # Get the appropriate style modifier
    style_modifier = style_modifiers.get(image_types.lower(), '')
    
    # Enhance the prompt with style
    enhanced_prompt = prompt + style_modifier
    
    print(f"🎨 Generating {quantity} {image_types} images...")
    print(f"📝 Enhanced prompt: {enhanced_prompt}")
    print(f"📐 Dimensions: {dimension['width']}x{dimension['height']}")
    
    image_urls = []
    
    # Generate multiple images with different seeds for variety
    for i in range(quantity):
        # Create unique seed for each image
        seed = 42 + i * 100  # Different seed for each image
        
        # Prepare arguments for the run function
        args = {
            'description': enhanced_prompt,
            'height': dimension['height'],
            'width': dimension['width'],
            'seed': seed
        }
        
        print(f"🔄 Generating image {i+1}/{quantity} (seed: {seed})...")
        
        # Call the run function
        result = run(args)
        
        if 'error' in result:
            print(f"❌ Error for image {i+1}: {result['error']}")
            image_urls.append({'error': result['error'], 'image_number': i+1})
        else:
            print(f"✅ Image {i+1} generated successfully")
            image_urls.append(result['image_url'])
    
    print(f"🎉 Generated {len([url for url in image_urls if isinstance(url, str)])} out of {quantity} images successfully")
    
    return image_urls
    
    
# Example usage - calling the run function with args
if __name__ == "__main__":
    print("🎨 POLLINATIONS IMAGE GENERATOR")
    print("=" * 40)
    
    # Define test arguments
    test_args = {
        'description': 'A AD poster of Iphone 15 pro max sleek design',
        'height': 512,
        'width': 512,
        'num_inference_steps': 30,
        'guidance_scale': 7.5,
        'seed': 42
    }
    
    result = run(test_args)
    
   
    if 'error' in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"✅ Success! Image generated:")
        print(f"🖼️ Image URL: {result['image_url']}")
    
    print("\n" + "=" * 40)
    print("🎉 Test complete!")

    # Test the visual_asset_manager function
    print("\n🎨 Testing visual_asset_manager function...")
    print("=" * 50)
    
    # Test parameters
    test_prompt = "A futuristic robot holding a red skateboard"
    test_quantity = 3
    test_image_type = "realistic"
    test_dimensions = {'height': 512, 'width': 512}
    
    # Call visual_asset_manager
    image_urls = visual_asset_manager(
        prompt=test_prompt,
        quantity=test_quantity,
        image_types=test_image_type,
        dimension=test_dimensions
    )
    
    print(f"\n📋 Results:")
    for i, url in enumerate(image_urls, 1):
        if isinstance(url, str):
            print(f"Image {i}: {url}")
        else:
            print(f"Image {i}: {url}")
    
    
    
  