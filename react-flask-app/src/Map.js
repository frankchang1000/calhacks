import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null); // Ref for the Mapbox map instance
  const [currentCenter, setCurrentCenter] = useState([-122.4194, 37.7749]);

  useEffect(() => {
    mapboxgl.accessToken = "pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ";

    // Initialize the map only once
    if (mapRef.current) return;

    // Create the map instance
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard', // Use the style you specified
      center: currentCenter,
      zoom: 10,
      doubleClickZoom: false,
    });

    // Update center state on move end
    mapRef.current.on('moveend', () => {
      const center = mapRef.current.getCenter();
      setCurrentCenter([center.lng, center.lat]);
    });

    // Add navigation controls
    mapRef.current.addControl(new mapboxgl.NavigationControl());

    // Load the GeoJSON data and add it to the map
    mapRef.current.on('load', () => {
      fetch('/output.geojson')
        .then(response => response.json())
        .then(geojsonData => {
          mapRef.current.addSource('points', {
            type: 'geojson',
            data: geojsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          // Add cluster layers
          mapRef.current.addLayer({
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

          // Add cluster count labels
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

          // Add unclustered point layer
          mapRef.current.addLayer({
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
            const { name, resource_type } = e.features[0].properties;

            // Ensure the popup appears over the correct location
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`<strong>${name}</strong><br>${resource_type}`)
              .addTo(mapRef.current);
          });

          // Change cursor to pointer when over clusters
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

  return (
    <div className="map-wrapper">
      <div className="map-container" ref={mapContainerRef} />
    </div>
  );
};

export default Map;
