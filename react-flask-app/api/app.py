from flask import Flask, request, jsonify, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def hello_world():
  return 'Hello, World!'

# Example route for signup
@app.route('/signup', methods=['GET'])
def signup_read():
    return "welcome to signup"

@app.route('/signup', methods=['POST'])
def signup_update():
    return "welcome to signup"
  
@app.route('/toilets', methods=['GET'])
def toilets_read():
    return "welcome to toilets"

@app.route('/toilets', methods=['POST'])
def toilets_update():
    return "welcome to toilets"

@app.route('/toilet-map', methods=['GET'])
def toilet_map_read():
    return "welcome to toilet-map"

# # Example route to get all toilets
# @app.route('/toilets', methods=['GET'])
# def get_toilets():
#     toilets = Toilet.query.all()
#     return jsonify([toilet.to_dict() for toilet in toilets])

# # Example route to add a toilet
# @app.route('/toilets', methods=['POST'])
# def add_toilet():
#     data = request.json
#     toilet = Toilet(
#         name=data['name'],
#         resource_type=data['resource_type'],
#         latitude=data['latitude'],
#         longitude=data['longitude'],
#         access=data['access'],
#         location=f'SRID=4326;POINT({data["longitude"]} {data["latitude"]})'
#     )
#     db.session.add(toilet)
#     db.session.commit()
#     return jsonify(toilet.to_dict()), 201

if __name__ == '__main__':
    app.run(debug=True)

if __name__ == "__main__":
  app.run(debug=True)
  