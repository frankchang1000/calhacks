import csv
import json
import math

def lonlat_to_mercator(lon, lat):
    # Conversion constants
    R_MAJOR = 6378137.0

    x = R_MAJOR * math.radians(lon)
    y = R_MAJOR * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return x, y

# Initialize an empty list to store GeoJSON features
features = []

# Open the CSV file for reading
with open('clean_data.csv', 'r', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        # Extract latitude and longitude and convert them to float
        latitude = float(row['latitude'])
        longitude = float(row['longitude'])
        
        # Convert coordinates to EPSG:3857
        x, y = lonlat_to_mercator(longitude, latitude)
        
        # Create the geometry dictionary
        geometry = {
            "type": "Point",
            "coordinates": [x, y]
        }
        
        # Remove latitude and longitude from properties
        properties = {k: v for k, v in row.items() if k not in ['latitude', 'longitude']}
        
        # Create a feature for each row
        feature = {
            "type": "Feature",
            "geometry": geometry,
            "properties": properties
        }
        
        # Add the feature to the list
        features.append(feature)

# Create the FeatureCollection with CRS
feature_collection = {
    "type": "FeatureCollection",
    "crs": {
        "type": "name",
        "properties": {
            "name": "EPSG:3857"
        }
    },
    "features": features
}

# Write the GeoJSON to a file
with open('output_new.geojson', 'w', encoding='utf-8') as f:
    json.dump(feature_collection, f, indent=2)
