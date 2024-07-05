from flask import Flask, jsonify, request
from recipe_scrapers import scrape_me
from flask_cors import CORS
import requests
from io import BytesIO

app = Flask(__name__)
CORS(app)

@app.route('/api/scraper', methods=['GET'])
def scraper():
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "URL parameter is required"}), 400

    try:
        # First attempt to scrape without wild_mode
        scraper = scrape_me(url)
        recipe = get_recipe_details(scraper, url)
        return jsonify(recipe)
    except Exception as e:
        # If the error is related to site not being supported, retry with wild_mode
        if "not supported" in str(e):
            try:
                scraper = scrape_me(url, wild_mode=True)
                recipe = get_recipe_details(scraper, url)
                return jsonify(recipe)
            except Exception as e:
                return jsonify({"error": f"Failed with wild_mode: {str(e)}"}), 500
        else:
            return jsonify({"error": str(e)}), 500

def get_recipe_details(scraper, url):
    """Helper function to extract recipe details with default messages if not available."""
    try:
        name = scraper.title()
    except:
        name = None
    try:
        ingredients = scraper.ingredients()
    except:
        ingredients = None
    try:
        instructions = scraper.instructions()
    except:
        instructions = None
    try:
        image_url = scraper.image()
        if is_image_too_small(image_url):
            image_url = None
    except:
        image_url = None
    return {
        "name": name,
        "ingredients": ingredients,
        "instructions": instructions,
        "imageUrl": image_url
    }

def is_image_too_small(image_url):
    """Check if the image is too small."""
    try:
        response = requests.get(image_url)
        image = BytesIO(response.content)
        if len(image.getvalue()) < 10000:  # less than 10KB
            return True

        width, height = get_image_dimensions(image)
        if width < 300 or height < 300:  # example dimension check
            return True
        return False
    except Exception as e:
        return True

def get_image_dimensions(image):
    """Get dimensions of the image."""
    from struct import unpack
    image.seek(0)
    header = image.read(24)
    if len(header) != 24:
        return 0, 0
    # PNG
    if header.startswith(b'\211PNG\r\n\032\n') and header[12:16] == b'IHDR':
        width, height = unpack('>LL', header[16:24])
    # GIF
    elif header[:6] in (b'GIF87a', b'GIF89a'):
        width, height = unpack('<HH', header[6:10])
    # JPEG
    elif header.startswith(b'\xff\xd8'):
        try:
            image.seek(0)
            size = 2
            ftype = 0
            while not 0xc0 <= ftype <= 0xcf:
                image.seek(size, 1)
                byte = image.read(1)
                while ord(byte) == 0xff:
                    byte = image.read(1)
                ftype = ord(byte)
                size = unpack('>H', image.read(2))[0] - 2
            image.seek(1, 1)
            height, width = unpack('>HH', image.read(4))
        except Exception:
            return 0, 0
    else:
        return 0, 0
    return width, height

if __name__ == "__main__":
    app.run(port=5328)
