from flask import Flask, jsonify, request
from recipe_scrapers import scrape_html
from flask_cors import CORS
import requests
import cloudscraper
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

# Browser-like headers to avoid 403 blocks from recipe sites
BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
}

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

def fetch_html(url: str) -> str:
    """
    Fetch HTML from a URL, falling back to cloudscraper if the standard
    session is blocked by Cloudflare or similar anti-bot protection.
    
    Timeout budget: 8s standard + 12s cloudscraper = 20s worst case.
    The caller (Next.js) has a 25s timeout for the entire Flask API call.
    """
    response = session.get(url, headers=BROWSER_HEADERS, timeout=8)

    if response.status_code in (403, 402):
        logger.info(f"Standard request blocked ({response.status_code}), retrying with cloudscraper: {url}")
        cf_scraper = cloudscraper.create_scraper()
        response = cf_scraper.get(url, timeout=12)

        if response.status_code in (403, 402):
            logger.warning(f"Access blocked ({response.status_code}) even with cloudscraper for URL: {url}")
            raise AccessBlockedError(url, response.status_code)

    if not response.ok:
        response.raise_for_status()

    return response.text


class AccessBlockedError(Exception):
    """Raised when a site blocks all scraping attempts."""
    def __init__(self, url: str, status_code: int):
        self.url = url
        self.status_code = status_code
        super().__init__(f"Access blocked ({status_code}) for URL: {url}")


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
        html = fetch_html(url)

        try:
            scraper = scrape_html(html=html, org_url=url)
            recipe = get_recipe_details(scraper, url)
            return jsonify(recipe)
        except Exception as e:
            if "not supported" in str(e) or "isn't currently supported" in str(e):
                logger.info(f"Retrying with supported_only=False: {url}")
                scraper = scrape_html(html=html, org_url=url, supported_only=False)
                recipe = get_recipe_details(scraper, url)
                return jsonify(recipe)
            else:
                raise
    except AccessBlockedError:
        return jsonify({
            "error": "This website blocked automated access. Try adding the recipe manually instead.",
            "blocked": True
        }), 403
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5328)