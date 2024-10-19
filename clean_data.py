import csv
import json

# Initialize an empty list to store GeoJSON features
features = []

# Open the CSV file for reading
with open('clean_data.csv', 'r', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        # Extract latitude and longitude and convert them to float
        latitude = float(row['latitude'])
        longitude = float(row['longitude'])
        
        # Create the geometry dictionary
        geometry = {
            "type": "Point",
            "coordinates": [longitude, latitude]
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

# Create the FeatureCollection
feature_collection = {
    "type": "FeatureCollection",
    "features": features
}

# Write the GeoJSON to a file
with open('output.geojson', 'w', encoding='utf-8') as f:
    json.dump(feature_collection, f, indent=2)
