import { Card, Tab, TabList, Tabs, Text } from "@chakra-ui/react";
import MapboxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import React, { useEffect, useRef, useState } from 'react';
import './Map.css';

import { Box, Button, Image, HStack } from "@chakra-ui/react";


const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [currentCenter, setCurrentCenter] = useState([-122.40311842433256, 37.784493375240594]);
  const [nearestRestrooms, setNearestRestrooms] = useState([]);
  const [directions, setDirections] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const mapToken = "pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ";
  const [originCoords, setOriginCoords] = useState(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [destinationInput, setDestinationInput] = useState("");
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);
  const [showDestinationSearch, setShowDestinationSearch] = useState(false);
  const [showTabs, setShowTabs] = useState(false); // Manage tabs visibility

  
  // Initialize Mapbox Geocoding client
  const geocodingClient = MapboxGeocoding({
    accessToken: mapToken,
  });

  useEffect(() => {
    mapboxgl.accessToken = mapToken;

    // Initialize the map only once
    if (mapRef.current) return;

    // Create the map instance
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: currentCenter,
      zoom: 10,
      doubleClickZoom: false,
    });

    // Update center state on move end
    /*
    mapRef.current.on('moveend', () => {
      const center = mapRef.current.getCenter();
      setCurrentCenter([center.lng, center.lat]);
    });
  */
    // Add navigation controls
    mapRef.current.addControl(new mapboxgl.NavigationControl());

    // Load the GeoJSON data and add it to the map
    mapRef.current.on('load', () => {
      fetch('/output.geojson')
        .then(response => response.json())
        .then(geojsonData => {
          setGeojsonData(geojsonData); // Store GeoJSON data in state

          mapRef.current.addSource('points', {
            type: 'geojson',
            data: geojsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          mapRef.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'points',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#8F5B4A',
                50,
                '#FFDC51',
                100,
                '#FFDC51',
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                15,
                50,
                20,
                100,
                25,
              ],
            },
          });

          mapRef.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'points',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
          });

          mapRef.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'points',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#70FF1D',
              'circle-radius': 6,
              'circle-stroke-width': 1,
              'circle-stroke-color': '#fff',
            },
          });

          // Click event for clusters
          mapRef.current.on('click', 'clusters', (e) => {
            const features = mapRef.current.queryRenderedFeatures(e.point, {
              layers: ['clusters'],
            });
            const clusterId = features[0].properties.cluster_id;
            mapRef.current
              .getSource('points')
              .getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err) return;

                mapRef.current.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom: zoom,
                });
              });
          });

          // Click event for unclustered points
          mapRef.current.on('click', 'unclustered-point', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;

            let popupContent = "";
            Object.entries(properties).forEach(([key, value]) => {
              popupContent += `${key}: ${value}<br>`;
            });

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(popupContent)
              .addTo(mapRef.current);
          });

          mapRef.current.on('mouseenter', 'clusters', () => {
            mapRef.current.getCanvas().style.cursor = 'pointer';
          });

          mapRef.current.on('mouseleave', 'clusters', () => {
            mapRef.current.getCanvas().style.cursor = '';
          });
        })
        .catch((error) => console.error('Error loading GeoJSON data:', error));
    });

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.off('moveend');
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures useEffect runs once


  const getRoute = async (start, end) => {
    if (!start || !end || start.length < 2 || end.length < 2) {
      console.error("Invalid start or end coordinates");
      return;
    }

    try {
      let url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&overview=full&access_token=${mapToken}`;

      const response = await fetch(url, { method: "GET" });
      const json = await response.json();

      if (!json.routes || json.routes.length === 0) {
        console.error("No routes found");
        return;
      }

      const data = json.routes[0];
      const route = data.geometry.coordinates;
      const geojson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: route,
        },
      };

      if (mapRef.current.getSource("route")) {
        mapRef.current.getSource("route").setData(geojson);
      } else {
        mapRef.current.addLayer({
          id: "route",
          type: "line",
          source: {
            type: "geojson",
            data: geojson,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#8F5B4A",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });
      }

      const bounds = new mapboxgl.LngLatBounds();
      route.forEach((coord) => bounds.extend(coord));
      mapRef.current.fitBounds(bounds, {
        padding: 50,
      });

      const steps = data.legs[0].steps;
      const tripInstructions = steps.map((step) => step.maneuver.instruction);
      setDirections({
        duration: Math.floor(data.duration / 60),
        distance: Math.round((data.distance / 1000) * 10) / 10,
        instructions: tripInstructions,
      });

      console.log('Setting directions with:', {
        duration: Math.floor(data.duration / 60),
        distance: Math.round((data.distance / 1000) * 10) / 10,
        instructions: tripInstructions,
      });

    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  const handleReset = () => {
    setDestinationCoords(null);
    setNearestRestrooms([]);
    setDirections(null);

    // Remove the route layer from the map if it exists
    if (mapRef.current.getSource("route")) {
      mapRef.current.getSource("route").setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  };

  const handleRestroomSelect = (restroom) => {
    setDestinationCoords(restroom.geometry.coordinates);
    // Fly to the selected restroom
    mapRef.current.flyTo({ center: restroom.geometry.coordinates, zoom: 14 });
  };

  const findNearestRestrooms = () => {
    if (!geojsonData || !originCoords) return;

    // Compute distances to each restroom
    const featuresWithDistance = geojsonData.features.map((feature) => {
      const coords = feature.geometry.coordinates;
      const distance = computeDistance(originCoords, coords);
      return { ...feature, distance };
    });

    // Sort features by distance
    featuresWithDistance.sort((a, b) => a.distance - b.distance);

    // Get the 5 nearest restrooms
    const nearest = featuresWithDistance.slice(0, 5);
    setNearestRestrooms(nearest);
  };

  const computeDistance = (coord1, coord2) => {
    const R = 6371; // Earth's radius in km
    const lat1 = (coord1[1] * Math.PI) / 180;
    const lat2 = (coord2[1] * Math.PI) / 180;
    const deltaLat = lat2 - lat1;
    const deltaLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  //maybe? idk
  const handleInputChange = (e, setFunction) => {
    setFunction(e.target.value);
    if (e.target.value.trim()) {
      getDestinationSuggestions(e.target.value);
    } else {
      setDestinationSuggestions([]);
    }
  }  
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      calculateRoute();
    }
  }

  const getDestinationSuggestions = async (query) => {
    try {
      const response = await geocodingClient.forwardGeocode({
        query,
        limit: 5,
        types: ["place"],
      })
      .send();

      setDestinationSuggestions(response.body.features);
    } catch (error) {
      console.error("Error getting destination suggestions:", error);
    }
  }

  const handleDestinationSelect = (feature) => {
    setDestinationInput(feature.place_name);
    setDestinationCoords(feature.center);
    setShowDestinationSuggestions(false);
  }

  const calculateRoute = (origin, destination) => {
    if (!origin || !destination) {
      console.error("Origin or destination coordinates are not set.");
      return; // Early exit if coordinates are not valid
    }

    getRoute(origin, destination);

    
    
  };
  
  const handleStyleChange = (style) => {
    mapRef.current.setStyle(style);
  }

  const restrooms = [
    { name: "Mid-Market Pit Stop - Hallidie Plaza (JCDecaux)", coords: [-122.4077797, 37.7844142] },
    { name: "Union Square, Drinking Fountain/Cooler", coords: [-122.40697736, 37.787879229999994] },
    { name: "Salvation Army Headquarters", coords: [-122.4020001, 37.7814174] },
    { name: "SoMa Pit Stop - 6th and Natoma streets", coords: [-122.4077046, 37.780182] },
    { name: "Tenderloin Pit Stop - Taylor and Turk streets", coords: [-122.4108252, 37.7832058] }
  ];

  const handleClick = (coords) => {
    setDestinationCoords(coords); // Set the destination coordinates
    // get the route

    calculateRoute(currentCenter, coords);
    
  };

  // fly in when button clicked
  const flyToLocation = (location) => {
    mapRef.current.flyTo({
      center: currentCenter,
      zoom: 16,
      essential: true,
      speed: 0.5
    });
  };

  const handleShowRestroomsClick = () => {
    setShowTabs(true);
    flyToLocation(currentCenter); // Call flyToLocation when button is clicked
  };


  const [activeTab, setActiveTab] = useState(1);

  return (
    <div>
      {/* Map Container */}
      <div className="map-container">
        <div className="map-container" ref={mapContainerRef} />

        {/* Conditionally render the button only if tabs are not shown */}
        {!showTabs && (
          <Box display="flex" justifyContent="center" mt={4}>
            <Button 
              color = '8F5B4A' 
              size="lg" 
              onClick={handleShowRestroomsClick} 
              boxShadow="lg"
              fontFamily="Avenir, sans-serif"
            >
              Show Restrooms
            </Button>
          </Box>
        )}

        {/* Render the tabs only when showTabs is true */}
        {showTabs && (
          <div className="nearest-restrooms" style={{ marginTop: '20px' }}> 
            <Card display="flex" align="center" margin="2" padding="2" background="#f7f7f7" as="b">
            <Text fontSize="2xl" fontFamily="Avenir, sans-serif">Five Closest Bathrooms</Text>
            </Card>
            <Tabs orientation="vertical" variant="soft-rounded" colorScheme="yellow" fontFamily="Avenir, sans-serif">
              <TabList>
                <Tab onClick={() => handleClick([-122.4077797, 37.7844142])}>
                  Mid-Market Pit Stop - Hallidie Plaza (JCDecaux)
                </Tab>
                <Tab onClick={() => handleClick([-122.40697736, 37.787879229999994])}>
                  Union Square, Drinking Fountain/Cooler
                </Tab>
                <Tab onClick={() => handleClick([-122.4020001, 37.7814174])}>
                  Salvation Army Headquarters
                </Tab>
                <Tab onClick={() => handleClick([-122.4077046, 37.780182])}>
                  SoMa Pit Stop - 6th and Natoma streets
                </Tab>
                <Tab onClick={() => handleClick([-122.4108252, 37.7832058])}>
                  Tenderloin Pit Stop - Taylor and Turk streets
                </Tab>
              </TabList>
            </Tabs>
          </div>
        )}
      </div>

      <div className="map-controls">
        {/* Directions Display */}
        {directions && (
          <div id="instructions">
            <div className="direction-header">
              <p>
                <strong>
                  Trip duration: {directions.duration} min ({directions.distance} km)
                </strong>
              </p>
            </div>

            <ol>
              {directions.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
            {/* Logo Positioned in the Bottom Right */}
      <Box position="fixed" bottom="10px" right="10px">
            <Image src="/logo.png" alt="Logo" boxSize="100px" />
      </Box>
    </div>
    
  );
};


export default Map;

