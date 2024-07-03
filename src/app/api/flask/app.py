from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/flask/scraper', methods=['GET'])
def hello_world():
    return jsonify(message="Hello, World!")

# No need for the `if __name__ == '__main__':` block, as Vercel handles the server startup.
