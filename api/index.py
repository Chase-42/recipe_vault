from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/python', methods=['GET'])
def scraper():
    return jsonify(message="This is the scraper endpoint")


