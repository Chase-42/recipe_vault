from http.server import BaseHTTPRequestHandler
import json
from recipe_scrapers import scrape_me

class handler(BaseHTTPRequestHandler):

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        url = data.get('url')

        if not url:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'error': 'URL is required'}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return

        try:
            scraper = scrape_me(url)
            recipe_details = {
                'imageUrl': scraper.image(),
                'instructions': scraper.instructions(),
                'ingredients': scraper.ingredients(),
            }
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(recipe_details).encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'error': str(e)}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return



