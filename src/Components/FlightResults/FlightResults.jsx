import React, { useEffect, useState } from 'react';
import L from 'leaflet';
import { useLocation } from 'react-router-dom';
import Papa from 'papaparse'; 
import 'leaflet/dist/leaflet.css';
import './FlightResults.css';

const FlightResults = () => {
  const location = useLocation();
  const [airportCoordinates, setAirportCoordinates] = useState({});
  const [iataCityMap, setIataCityMap] = useState({}); 
  const { destinationsData } = location.state || {};

  const loadAirportData = () => {
    return new Promise((resolve, reject) => {
      Papa.parse('/airports.csv', {
        download: true,
        header: true,
        complete: (results) => {
          const iataMap = {};
          results.data.forEach((row) => {
            if (row.IATA && row.City) {
              iataMap[row.IATA] = row.City; 
            }
          });
          resolve(iataMap);
        },
        error: (err) => reject(err),
      });
    });
  };

  const getAirportCoordinates = async (iataCode) => {
    const apiKey = '4b9d943039dd41adbeecc72d8f987460';
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${iataCode}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry;
      const country = data.results[0].components.country;
      return { lat, lng, country };
    } else {
      console.error(`No se encontraron coordenadas para el aeropuerto: ${iataCode}`);
      return null;
    }
  };

  useEffect(() => {
    const fetchCoordinatesAndData = async () => {
      try {
        const iataMap = await loadAirportData();
        setIataCityMap(iataMap);

        const coordinates = {};
        for (const flight of destinationsData.data) {
          const originCoords = await getAirportCoordinates(flight.origin);
          const destinationCoords = await getAirportCoordinates(flight.destination);

          coordinates[flight.origin] = originCoords;
          coordinates[flight.destination] = destinationCoords;
        }
        setAirportCoordinates(coordinates);
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    if (destinationsData?.data?.length > 0) {
      fetchCoordinatesAndData();
    }
  }, [destinationsData]);

  useEffect(() => {
    if (Object.keys(airportCoordinates).length > 0 && Object.keys(iataCityMap).length > 0) {
      const map = L.map('map').setView([41.3851, 2.1734], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const redIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const prices = destinationsData.data.map((flight) => parseFloat(flight.price.total));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;

      const getLineColor = (price) => {
        const normalizedPrice = (price - minPrice) / priceRange;

        if (normalizedPrice < 0.33) return 'rgba(0, 255, 0, 0.6)'; 
        if (normalizedPrice < 0.66) return 'rgba(255, 165, 0, 0.6)'; 
        return 'rgba(255, 0, 0, 0.6)'; 
      };

      for (const flight of destinationsData.data) {
        const originCoords = airportCoordinates[flight.origin];
        const destinationCoords = airportCoordinates[flight.destination];

        if (originCoords && destinationCoords) {
          const destinationCity = iataCityMap[flight.destination] || flight.destination;
          const destinationPopup = `
            <div>
              <strong>Destination: ${destinationCity}</strong><br>
              Country: ${destinationCoords.country}<br>
              Price: €${flight.price.total}<br>
              <button class="reserve-button" onclick="window.alert('Reservar en ${destinationCity}')">Book now</button>
            </div>
          `;

          L.marker([destinationCoords.lat, destinationCoords.lng], { icon: redIcon })
            .addTo(map)
            .bindPopup(destinationPopup);

          const lineColor = getLineColor(parseFloat(flight.price.total));

          L.polyline(
            [[originCoords.lat, originCoords.lng], [destinationCoords.lat, destinationCoords.lng]],
            { color: lineColor, weight: 3 }
          ).addTo(map);
        }
      }

      const bounds = Object.values(airportCoordinates).map((coords) => [coords.lat, coords.lng]);
      map.fitBounds(bounds);
    }
  }, [airportCoordinates, destinationsData, iataCityMap]);

  return (
    <div className="flight-results">
      <div id="map" style={{ width: '100vw', height: '100vh', marginBottom: '20px' }}></div>
    </div>
  );
};

export default FlightResults;
