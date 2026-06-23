import requests
import cloudscraper
from io import BytesIO
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional, Tuple, Union
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logger = logging.getLogger(__name__)

session = requests.Session()
retries = Retry(
    total=3,
    backoff_factor=0.1,
    status_forcelist=[500, 502, 503, 504]
)
session.mount('http://', HTTPAdapter(max_retries=retries))
session.mount('https://', HTTPAdapter(max_retries=retries))

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

MIN_IMAGE_SIZE = 10000
MIN_IMAGE_DIMENSION = 300


class AccessBlockedError(Exception):
    def __init__(self, url: str, status_code: int):
        self.url = url
        self.status_code = status_code
        super().__init__(f"Access blocked ({status_code}) for URL: {url}")


@lru_cache(maxsize=100)
def get_image_dimensions(image_url: str) -> Tuple[int, int]:
    try:
        response = session.get(image_url, timeout=5)
        image = BytesIO(response.content)

        if len(image.getvalue()) < MIN_IMAGE_SIZE:
            return (0, 0)

        image.seek(0)
        header = image.read(24)
        if len(header) != 24:
            return (0, 0)

        if header.startswith(b'\211PNG\r\n\032\n') and header[12:16] == b'IHDR':
            from struct import unpack
            width, height = unpack('>LL', header[16:24])
            return width, height

        elif header[:6] in (b'GIF87a', b'GIF89a'):
            from struct import unpack
            width, height = unpack('<HH', header[6:10])
            return width, height

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
    if not image_url:
        return False
    width, height = get_image_dimensions(image_url)
    return width >= MIN_IMAGE_DIMENSION and height >= MIN_IMAGE_DIMENSION


def extract_recipe_field(scraper, field_name: str) -> Optional[Union[str, List[str]]]:
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


def _is_action_label(step: str) -> bool:
    """Single-word all-lowercase tokens are HowToStep action labels, not real steps."""
    return bool(step) and step == step.lower() and ' ' not in step


def _parse_instructions(raw_steps: List[str]) -> List[str]:
    """Convert instructions_list() output to clean steps.

    Some sites emit interleaved pairs [label, step, label, step, ...] where each
    label is a single lowercase action word.  When the site HTML has no whitespace
    between the label element and the step content the scraper concatenates them
    (e.g. '<span>mix</span>the Tamari…' → 'Mixthe Tamari…').  We use the label
    itself to detect and repair that fusion rather than a generic regex.
    """
    result = []
    i = 0
    while i < len(raw_steps):
        step = raw_steps[i].strip()
        if _is_action_label(step):
            if i + 1 < len(raw_steps):
                next_step = raw_steps[i + 1].strip()
                cap_label = step.capitalize()
                # Repair fusion: "Mixthe Tamari" → "Mix the Tamari"
                if (next_step.startswith(cap_label)
                        and len(next_step) > len(cap_label)
                        and next_step[len(cap_label)].islower()):
                    next_step = cap_label + ' ' + next_step[len(cap_label):]
                result.append(next_step)
                i += 2
            else:
                i += 1  # orphaned label at end
        else:
            result.append(step)
            i += 1
    return result


def get_recipe_details(scraper) -> Dict:
    with ThreadPoolExecutor(max_workers=1) as executor:
        image_url = extract_recipe_field(scraper, 'image')
        image_future = executor.submit(validate_image, image_url) if image_url else None

        raw_steps: List[str] = extract_recipe_field(scraper, 'instructions_list') or []
        steps = _parse_instructions(raw_steps)

        recipe = {
            "name": extract_recipe_field(scraper, 'title'),
            "ingredients": extract_recipe_field(scraper, 'ingredients'),
            "instructions": '\n'.join(steps) if steps else None,
            "imageUrl": image_url if image_future and image_future.result() else None,
        }

    return recipe


def fetch_html(url: str) -> str:
    """
    Fetch HTML from a URL, falling back to cloudscraper if blocked.

    Timeout budget: 8s standard + 12s cloudscraper = 20s worst case.
    Caller (Next.js) has a 25s timeout for the entire Flask call.
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
