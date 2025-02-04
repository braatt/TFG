import React, { useState } from 'react';
import Popup from '../Popup/Popup';
import { useLocation } from 'react-router-dom';
import './SearchResults.css';

const CO2_PER_KM_FLIGHT = 200; 
const CO2_PER_KM_TRAIN = 20;  

const calculateCO2 = (distance, isFlight) => {
  return isFlight ? distance * CO2_PER_KM_FLIGHT : distance * CO2_PER_KM_TRAIN;
};

const SearchResults = () => {
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const {
    searchData,
    token,                
    locationInputIATA,
    destinationInputIATA,
    departDate,
    returnDate,
    isOneWay,
    price,
  } = location.state || {};

  const getFlightDistance = (segments) => {
    return 1000; 
  };

  const compareCO2 = (distance) => {
    const flightCO2 = calculateCO2(distance, true);
    const trainCO2 = calculateCO2(distance, false);

    if (trainCO2 < flightCO2) {
      return `It is more sustainable to travel by train (Emissions: ${trainCO2} g CO₂) than by plane (Emissions: ${flightCO2} g CO₂).`;
    } else {
      return `It is faster to travel by plane (Emissions: ${flightCO2} g CO₂) even though the train emits less (${trainCO2} g CO₂).`;
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupMessage('');
  };


  const handleGetPriceAlerts = async () => {
    const token = localStorage.getItem('token'); 

    if (!token) {
      setShowPopup(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          locationInputIATA,
          destinationInputIATA,
          departDate,
          returnDate,
          price,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Mostrar mensaje del servidor
        setPopupMessage(data.message || 'Search successfully registered. We will notify you.');
      } else {
        // Manejar errores
        setPopupMessage(data.message || 'Error registering search');
      }
    } catch (error) {
      console.error('Error al llamar a /api/search:', error);
      setPopupMessage('An error occurred while saving your search. Please try again later.');
    }

    setShowPopup(true);
  };

  return (
    <div className="main-content">
      <br /> <br />
      <div className="left-container">
        {}
        <button className="secondary-btn" onClick={handleGetPriceAlerts}>
          Get price alerts
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </div>

      {searchData?.data?.length > 0 ? (
        <div className="results-grid">
          {searchData.data.map((flight, index) => {
            const distance = getFlightDistance(flight.itineraries[0].segments);
            const co2Comparison = compareCO2(distance);

            return (
              <div key={index} className="flight-card">
                <h3 className="flight-title">
                  {`${flight.itineraries[0].segments[0].departure.iataCode} → ${flight.itineraries[0].segments.at(-1).arrival.iataCode}`}
                </h3>
                <div className="flight-info">
                  <div className="flight-section">
                    <h4>Outward flight</h4>
                    <p>
                      <strong>Departure:</strong>{' '}
                      {new Date(flight.itineraries[0].segments[0].departure.at).toLocaleString()}
                    </p>
                    <p>
                      <strong>Arrival:</strong>{' '}
                      {new Date(
                        flight.itineraries[0].segments.at(-1).arrival.at
                      ).toLocaleString()}
                    </p>
                    <p>
                      <strong>Company:</strong>{' '}
                      {flight.itineraries[0].segments[0].carrierCode}
                    </p>
                    <p>
                      <strong>Duration:</strong>{' '}
                      {flight.itineraries[0].duration.replace('PT', '').toLowerCase()}
                    </p>
                  </div>

                  {flight.itineraries[1] && (
                    <div className="flight-section">
                      <h4>Flight home</h4>
                      <p>
                        <strong>Departure:</strong>{' '}
                        {new Date(flight.itineraries[1].segments[0].departure.at).toLocaleString()}
                      </p>
                      <p>
                        <strong>Arrival:</strong>{' '}
                        {new Date(
                          flight.itineraries[1].segments.at(-1).arrival.at
                        ).toLocaleString()}
                      </p>
                      <p>
                        <strong>Company:</strong>{' '}
                        {flight.itineraries[1].segments[0].carrierCode}
                      </p>
                      <p>
                        <strong>Duration:</strong>{' '}
                        {flight.itineraries[1].duration.replace('PT', '').toLowerCase()}
                      </p>
                    </div>
                  )}
                </div>
                <p className="price">
                  <strong>Total price:</strong> €{flight.price.total}
                </p>
                <p className="co2-comparison">{co2Comparison}</p>
                <button className="book-btn">Book now</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-results">No results available.</div>
      )}

      {}
      {showPopup && <Popup message={popupMessage} onClose={handleClosePopup} />}
    </div>
  );
};

export default SearchResults;
