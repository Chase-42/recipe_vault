from flask import Flask, jsonify, request
from recipe_scrapers import scrape_me
from flask_cors import CORS

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
        recipe = get_recipe_details(scraper)
        return jsonify(recipe)
    except Exception as e:
        # If the error is related to site not being supported, retry with wild_mode
        if "not supported" in str(e):
            try:
                scraper = scrape_me(url, wild_mode=True)
                recipe = get_recipe_details(scraper)
                return jsonify(recipe)
            except Exception as e:
                return jsonify({"error": f"Failed with wild_mode: {str(e)}"}), 500
        else:
            return jsonify({"error": str(e)}), 500

def get_recipe_details(scraper):
    """Helper function to extract recipe details with default messages if not available."""
    try:
        name = scraper.title()
    except:
        name = "No title available"
    try:
        ingredients = scraper.ingredients()
    except:
        ingredients = ["No ingredients available"]
    try:
        instructions = scraper.instructions()
    except:
        instructions = "No instructions available"
    try:
        image_url = scraper.image()
    except:
        image_url = "No image available"
    return {
        "name": name,
        "ingredients": ingredients,
        "instructions": instructions,
        "imageUrl": image_url
    }

if __name__ == "__main__":
    app.run(port=5328)
