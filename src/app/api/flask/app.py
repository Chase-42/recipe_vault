from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/flask/scraper', methods=['GET'])
def scraper():
    return jsonify(message="This is the scraper endpoint")

# Ensure that app.py works as a module
if __name__ != "__main__":
    from werkzeug.middleware.dispatcher import DispatcherMiddleware
    from werkzeug.serving import run_simple

    application = DispatcherMiddleware(app, {
        '/api': app
    })
else:
    app.run(port=5328)
