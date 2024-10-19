// dataLoader.js

import Papa from 'papaparse';

export const loadCSVData = (callback) => {
  Papa.parse('/data_corrected.csv', {
    download: true,
    header: true,
    dynamicTyping: true, // Automatically convert numbers
    skipEmptyLines: true, // Skip empty lines if any
    complete: (results) => {
      // Debug: Check if the parsed rows contain valid latitude and longitude
      results.data.forEach((row, index) => {
        console.log(`Row ${index}:`, row);
      });

      const geojson = {
        type: 'FeatureCollection',
        features: results.data
          .filter((row) => {
            // Ensure that both latitude and longitude exist and are numbers
            const isValid = !isNaN(row.latitude) && !isNaN(row.longitude);
            if (!isValid) {
              console.warn(`Row ${row.name} has invalid coordinates: [${row.latitude}, ${row.longitude}]`);
            }
            return isValid;
          })
          .map((row, index) => {
            const coordinates = [row.longitude, row.latitude];

            // Debug: Print the valid coordinates being mapped
            console.log(`Parsed Feature ${index} Coordinates:`, coordinates);

            return {
              type: 'Feature',
              properties: {
                ...row,
              },
              geometry: {
                type: 'Point',
                coordinates: coordinates,
              },
            };
          }),
      };
      callback(geojson);
    },
  });
};
