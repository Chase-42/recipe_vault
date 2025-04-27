from flask import Flask, jsonify, request
from recipe_scrapers import scrape_me
from flask_cors import CORS
import requests
from io import BytesIO
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional, Tuple, Union
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Enable debug mode if FLASK_DEBUG is set
if os.environ.get('FLASK_DEBUG') == '1':
    app.config['DEBUG'] = True
    logger.setLevel(logging.DEBUG)
    logger.info("Debug mode enabled")

# Configure session with retries
session = requests.Session()
retries = Retry(
    total=3,
    backoff_factor=0.1,
    status_forcelist=[500, 502, 503, 504]
)
session.mount('http://', HTTPAdapter(max_retries=retries))
session.mount('https://', HTTPAdapter(max_retries=retries))

# Constants
MIN_IMAGE_SIZE = 10000  # 10KB
MIN_IMAGE_DIMENSION = 300

@lru_cache(maxsize=100)
def get_image_dimensions(image_url: str) -> Tuple[int, int]:
    """
    Get image dimensions with caching and better error handling.
    """
    try:
        response = session.get(image_url, timeout=5)
        image = BytesIO(response.content)
        
        if len(image.getvalue()) < MIN_IMAGE_SIZE:
            return (0, 0)

        image.seek(0)
        header = image.read(24)
        if len(header) != 24:
            return (0, 0)

        # PNG
        if header.startswith(b'\211PNG\r\n\032\n') and header[12:16] == b'IHDR':
            from struct import unpack
            width, height = unpack('>LL', header[16:24])
            return width, height

        # GIF
        elif header[:6] in (b'GIF87a', b'GIF89a'):
            from struct import unpack
            width, height = unpack('<HH', header[6:10])
            return width, height

        # JPEG
        elif header.startswith(b'\xff\xd8'):
            try:
                from struct import unpack
                image.seek(0)
                size = 2
                ftype = 0
                while not 0xc0 <= ftype <= 0xcf or ftype in [0xc4, 0xc8, 0xcc]:
                    image.seek(size, 1)
                    byte = image.read(1)
                    while ord(byte) == 0xff:
                        byte = image.read(1)
                    ftype = ord(byte)
                    size = unpack('>H', image.read(2))[0] - 2
                image.seek(1, 1)
                height, width = unpack('>HH', image.read(4))
                return width, height
            except Exception as e:
                logger.error(f"Error processing JPEG: {e}")
                return (0, 0)
        return (0, 0)
    except Exception as e:
        logger.error(f"Error getting image dimensions: {e}")
        return (0, 0)

def validate_image(image_url: str) -> bool:
    """
    Validate image size and dimensions.
    """
    if not image_url:
        return False
    
    width, height = get_image_dimensions(image_url)
    return width >= MIN_IMAGE_DIMENSION and height >= MIN_IMAGE_DIMENSION

def extract_recipe_field(scraper, field_name: str) -> Optional[Union[str, List[str]]]:
    """
    Safely extract a field from the scraper with proper error handling.
    """
    try:
        value = getattr(scraper, field_name)()
        if isinstance(value, str) and not value.strip():
            return None
        if isinstance(value, list) and not any(v.strip() for v in value):
            return None
        return value
    except Exception as e:
        logger.error(f"Error extracting {field_name}: {e}")
        return None

def get_recipe_details(scraper, url: str) -> Dict:
    """
    Extract recipe details with concurrent image validation.
    """
    with ThreadPoolExecutor(max_workers=1) as executor:
        # Start image validation in background
        image_url = extract_recipe_field(scraper, 'image')
        image_future = executor.submit(validate_image, image_url) if image_url else None

        # Extract other fields while image is being validated
        recipe = {
            "name": extract_recipe_field(scraper, 'title'),
            "ingredients": extract_recipe_field(scraper, 'ingredients'),
            "instructions": extract_recipe_field(scraper, 'instructions'),
            "imageUrl": image_url if image_future and image_future.result() else None
        }

    return recipe

@app.route('/api/scraper', methods=['GET'])
def scraper():
    """
    Main scraper endpoint with improved error handling and logging.
    """
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "URL parameter is required"}), 400

    logger.info(f"Processing URL: {url}")

    try:
        scraper = scrape_me(url)
        recipe = get_recipe_details(scraper, url)
        return jsonify(recipe)
    except Exception as e:
        if "not supported" in str(e):
            try:
                logger.info(f"Retrying with wild_mode: {url}")
                scraper = scrape_me(url, wild_mode=True)
                recipe = get_recipe_details(scraper, url)
                return jsonify(recipe)
            except Exception as e:
                logger.error(f"Failed with wild_mode: {e}")
                return jsonify({"error": f"Failed with wild_mode: {str(e)}"}), 500
        else:
            logger.error(f"Scraping failed: {e}")
            return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5328)