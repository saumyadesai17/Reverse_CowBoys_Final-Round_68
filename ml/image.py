import json
import requests

def visual_asset_manager(args: dict) -> dict:
    """
    Generate one or more images using the Pollinations open API.

    Args:
    - args (dict): A dictionary with the following keys:
        - prompt (str, required): Detailed image generation prompt.
        - quantity (int, optional): Number of images to generate (1–10). Default = 1.
        - dimensions (dict, optional): Object with "width" and "height" integers.
        - image_style (str, optional): One of ["photorealistic", "illustration", "minimal", "abstract"].

    Returns:
    - dict: A dictionary containing a list of generated image URLs or an error message.
    """

    # --- Validate required fields ---
    if 'prompt' not in args or not isinstance(args['prompt'], str) or not args['prompt'].strip():
        return {'error': 'Missing or invalid required parameter: prompt'}

    # --- Handle quantity ---
    quantity = args.get('quantity', 1)
    if not isinstance(quantity, int) or quantity < 1 or quantity > 10:
        return {'error': 'Quantity must be an integer between 1 and 10'}

    # --- Handle dimensions ---
    dimensions = args.get('dimensions', {})
    width = dimensions.get('width', 512)
    height = dimensions.get('height', 512)

    if not isinstance(width, int) or not isinstance(height, int) or width <= 0 or height <= 0:
        return {'error': 'Width and height must be positive integers'}

    # --- Handle style ---
    valid_styles = ["photorealistic", "illustration", "minimal", "abstract"]
    image_style = args.get('image_style')
    if image_style and image_style not in valid_styles:
        return {'error': f'Invalid image_style. Must be one of {valid_styles}'}

    # --- Construct final prompt ---
    full_prompt = args['prompt']
    if image_style:
        full_prompt = f"{image_style} style, {full_prompt}"

    # --- Pollinations public API (no key required) ---
    base_url = "https://image.pollinations.ai/prompt/"

    image_urls = []
    for i in range(quantity):
        # Each image uses same prompt but may vary by seed
        seed = 42 + i  # deterministic variation
        prompt_url = f"{base_url}{requests.utils.quote(full_prompt)}?width={width}&height={height}&seed={seed}"
        image_urls.append(prompt_url)

    return {"image_urls": image_urls}

result = visual_asset_manager({
    "prompt": "a cyberpunk city at night with neon lights",
    "quantity": 3,
    "dimensions": {"width": 512, "height": 512},
    "image_style": "photorealistic"
})

print(result)

