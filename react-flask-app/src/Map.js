import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

const Map = () => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = "pk.eyJ1IjoiZnJhbmtjaGFuZzEwMDAiLCJhIjoiY20xbGFzcG1hMDNvaTJxbjY3a3N4NWw4dyJ9.W78DlIwDnlVOrCE5F1OnkQ"

    if (!mapboxgl.accessToken) {
      console.error("Mapbox access token is not set");
      return;
    }

    console.log("Mapbox Access Token:", mapboxgl.accessToken);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-122.4194, 37.7749], // San Francisco coordinates
      zoom: 12,
    });

    map.on("load", () => {
      console.log("Map has loaded");
    });

    // Clean up on unmount
    return () => map.remove();
  }, []);

  return (
    <div className="map-wrapper">
      <p>The Map component is rendering.</p>
      <div className="map-container" ref={mapContainerRef} />
    </div>
  );
};

export default Map;
