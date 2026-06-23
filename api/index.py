import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from recipe_scrapers import scrape_html
import logging

from _scraper import fetch_html, get_recipe_details, AccessBlockedError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

if os.environ.get('FLASK_DEBUG') == '1':
    app.config['DEBUG'] = True
    logger.setLevel(logging.DEBUG)
    logger.info("Debug mode enabled")


@app.route('/api/scraper', methods=['GET'])
def scraper():
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "URL parameter is required"}), 400

    logger.info(f"Processing URL: {url}")

    try:
        html = fetch_html(url)

        try:
            scraper_obj = scrape_html(html=html, org_url=url)
            recipe = get_recipe_details(scraper_obj)
            return jsonify(recipe)
        except Exception as e:
            if "not supported" in str(e) or "isn't currently supported" in str(e):
                logger.info(f"Retrying with supported_only=False: {url}")
                scraper_obj = scrape_html(html=html, org_url=url, supported_only=False)
                recipe = get_recipe_details(scraper_obj)
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
