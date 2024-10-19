import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const Map = () => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    mapboxgl.accessToken = "YOUR_MAPBOX_ACCESS_TOKEN";

    if (!mapboxgl.supported()) {
      alert('Your browser does not support Mapbox GL');
      return;
    }

    const initializeMap = () => {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11', // Use a valid style
        center: [-122.4194, 37.7749],
        zoom: 12,
      });

      map.on('load', () => {
        fetch('/output.geojson')
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(geojsonData => {
            console.log('GeoJSON Data:', geojsonData); // Debug to ensure data is fetched
            map.addSource('points', {
              type: 'geojson',
              data: geojsonData,
              cluster: true,
              clusterMaxZoom: 12, // Adjust max zoom for clustering
              clusterRadius: 60,  // Adjust cluster radius
            });

            addClusterLayers(map);

            setMap(map);
          })
          .catch(error => console.error('Error loading GeoJSON data:', error));
      });
    };

    if (!map) initializeMap();

    // Clean up on unmount
    return () => map && map.remove();
  }, [map]);

  const addClusterLayers = (map) => {
    // Cluster circles
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'points',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          50,
          '#f1f075',
          100,
          '#f28cb1',
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

    // Cluster count labels
    map.addLayer({
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

    // Unclustered points
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'points',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#11b4da',
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
      },
    });

    // Click event for clusters
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });
      const clusterId = features[0].properties.cluster_id;
      map.getSource('points').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
    });

    // Click event for unclustered points
    map.on('click', 'unclustered-point', (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const { name, resource_type } = e.features[0].properties;

      // Ensure the popup appears over the correct location
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<strong>${name}</strong><br>${resource_type}`)
        .addTo(map);
    });

    // Change cursor to pointer when over clusters
    map.on('mouseenter', 'clusters', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', 'clusters', () => {
      map.getCanvas().style.cursor = '';
    });
  };

  return (
    <div className="map-wrapper">
      <div className="map-container" ref={mapContainerRef} />
    </div>
  );
};

export default Map;
