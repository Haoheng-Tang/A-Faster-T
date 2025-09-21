# Add estimate endpoint for POST requests
import random
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__, static_folder='../dist', static_url_path='/')
CORS(app)

@app.route('/api/estimate', methods=['POST'])
def estimate():
    data = request.get_json()
    print("Received estimate request:", data)  # <-- Add this line
    # You can use data['nodeId'], data['lat'], data['lon'], data['date'], data['time'] if needed
    value = random.randint(14, 28)
    return jsonify({'value': value})

@app.route('/api/ping')
def ping():
    return jsonify({'pong': True})

@app.route('/api/data')
def data():
    # simple example: return mock vehicle positions
    return jsonify([
        {'id': 'bus:1', 'lat': 42.35, 'lon': -71.08, 'type': 'bus'},
        {'id': 'train:1', 'lat': 42.36, 'lon': -71.06, 'type': 'train'},
    ])

# Optional: serve the built React app in production
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
