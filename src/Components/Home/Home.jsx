import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './Home.css';
import Popup from '../Popup/Popup';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [locationInput, setLocationInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [suggestionsFrom, setSuggestionsFrom] = useState([]);
  const [suggestionsTo, setSuggestionsTo] = useState([]);
  const [airports, setAirports] = useState([]);
  const [isOneWay, setIsOneWay] = useState(false);
  const [isAnyCity, setIsAnyCity] = useState(false);

  const [locationInputIATA, setLocationInputIATA] = useState('');
  const [destinationInputIATA, setDestinationInputIATA] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    Papa.parse('/airports.csv', {
      download: true,
      header: true,
      complete: (result) => {
        setAirports(result.data);
      },
    });
  }, []);

  const getToken = async () => {
    const clientId = 'UGw0qZgoWA5ykR6QjAgFcpowAbnlEeIt';
    const clientSecret = 'VlZGyMZQreGU4xH9';
  
    const url = 'https://test.api.amadeus.com/v1/security/oauth2/token';
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        return data.access_token;
      } else {
        console.error('Error al obtener el token:', data);
        return null;
      }
    } catch (error) {
      console.error('Error al conectar con la API:', error);
      return null;
    }
  };
  
  const handleLocationInput = (e) => {
    const query = e.target.value;
    setLocationInput(query);

    if (query.length >= 3) {
      const filteredSuggestions = airports
        .filter((airport) => {
          return (
            (airport.Country && airport.Country.toLowerCase().includes(query.toLowerCase())) ||
            (airport.City && airport.City.toLowerCase().includes(query.toLowerCase()))
          );
        })
        .map((airport) => `${airport.Country}, ${airport.City}, ${airport.IATA}`);

      const uniqueSuggestions = [...new Set(filteredSuggestions)];

      setSuggestionsFrom(uniqueSuggestions);
    } else {
      setSuggestionsFrom([]);
    }
  };

  const handleDestinationInput = (e) => {
    const query = e.target.value;
    setDestinationInput(query);

    if (query.length >= 3) {
      const filteredSuggestions = airports
        .filter((airport) => {
          return (
            (airport.Country && airport.Country.toLowerCase().includes(query.toLowerCase())) ||
            (airport.City && airport.City.toLowerCase().includes(query.toLowerCase()))
          );
        })
        .map((airport) => `${airport.Country}, ${airport.City}, ${airport.IATA}`);

      const uniqueSuggestions = [...new Set(filteredSuggestions)];

      setSuggestionsTo(uniqueSuggestions);
    } else {
      setSuggestionsTo([]);
    }
  };

  const handleSuggestionSelect = (suggestion, field) => {
    const iataCode = suggestion.split(', ').pop();

    if (field === 'from') {
      setLocationInput(suggestion);
      setSuggestionsFrom([]);
      setLocationInputIATA(iataCode);
    } else if (field === 'to') {
      setDestinationInput(suggestion);
      setSuggestionsTo([]);
      setDestinationInputIATA(iataCode);
    }
  };

  const handleDepartDateChange = (e) => setDepartDate(e.target.value);
  const handleReturnDateChange = (e) => setReturnDate(e.target.value);

  const toggleOneWay = () => setIsOneWay(!isOneWay);
  const toggleAnyCity = () => setIsAnyCity(!isAnyCity);

  const handleSearch = async () => {
    const tokenLogin = localStorage.getItem('token');
    const token = await getToken();

    if (!tokenLogin) {
      setMessage('You must log in to search for flights.');
      setShowPopup(true);
      return;
    }

    if (isAnyCity) {
      if (!locationInputIATA || !departDate || !price) {
        setMessage('Please complete all required fields before searching.');
        setShowPopup(true);
        return;
      }

      const url = `https://test.api.amadeus.com/v1/shopping/flight-destinations?origin=${locationInputIATA}&departureDate=${departDate}&oneWay=true&nonStop=false&maxPrice=${price}`;

      try {
        if (!token) {
          console.error('No se pudo obtener el token de acceso.');
          return;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          navigate('/flight-results', { state: { destinationsData: data } });
        } else {
          setMessage(data.message || 'There was a problem getting the destinations.');
          setShowPopup(true);
        }
      } catch (error) {
        console.error('Error al obtener los destinos:', error);
        setMessage('There was an error processing your search.');
        setShowPopup(true);
      }
    } else {
      if (
        !locationInputIATA ||
        !destinationInputIATA ||
        !departDate ||
        (!isOneWay && !returnDate) ||
        !price
      ) {
        setMessage('Please complete all fields before searching.');
        setShowPopup(true);
        return;
      }

      const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${locationInputIATA}&destinationLocationCode=${destinationInputIATA}&departureDate=${departDate}${
        !isOneWay ? `&returnDate=${returnDate}` : ''
      }&adults=1&maxPrice=${price}&max=10`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (response.ok) {
          navigate('/search-results', {
            state: {
              searchData: data,
              token: token,
              locationInputIATA: locationInputIATA,
              destinationInputIATA: destinationInputIATA,
              departDate: departDate,
              returnDate: isOneWay ? null : returnDate,
              isOneWay: isOneWay,
              price: price,
            },
          });
        } else {
          setMessage(data.message || 'There was a problem performing your search.');
          setShowPopup(true);
        }
      } catch (error) {
        console.error('Error al realizar la solicitud a la API:', error);
        setMessage('There was a problem performing your search.');
        setShowPopup(true);
      }
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <section className="home">
      <div className="secContainer container">
        <div className="homeText">
          <br />
          <br />
          <br />
          <h1 className="title">Plan your trip without searching</h1>
          <p className="subTitle">It has never been so easy!</p>
          <br />
        </div>

        <div className="homeCard grid">
          <div className="locationDiv">
            <label htmlFor="location">From</label>
            <input
              type="text"
              id="location"
              placeholder="From"
              value={locationInput}
              onChange={handleLocationInput}
            />
            {suggestionsFrom.length > 0 && (
              <ul className="suggestions-list">
                {suggestionsFrom.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion, 'from')}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!isAnyCity && (
            <div className="distDiv">
              <label htmlFor="distance">To</label>
              <input
                type="text"
                id="distance"
                placeholder="To"
                value={destinationInput}
                onChange={handleDestinationInput}
              />
              {suggestionsTo.length > 0 && (
                <ul className="suggestions-list">
                  {suggestionsTo.map((suggestion, index) => (
                    <li
                      key={index}
                      onClick={() => handleSuggestionSelect(suggestion, 'to')}
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="oneWayCheckbox">
            <label>
              <input
                type="checkbox"
                checked={isOneWay}
                onChange={toggleOneWay}
                disabled={isAnyCity} 
              />
              One Way
            </label>
            <label>
              <input
                type="checkbox"
                checked={isAnyCity}
                onChange={toggleAnyCity}
              />
              Any city
            </label>
          </div>

          <div className="dateDiv">
            <label htmlFor="departDate">Depart</label>
            <input
              type="date"
              id="departDate"
              value={departDate}
              onChange={handleDepartDateChange}
            />
          </div>

          {!isOneWay && !isAnyCity && (
            <div className="dateDiv">
              <label htmlFor="returnDate">Return</label>
              <input
                type="date"
                id="returnDate"
                value={returnDate}
                onChange={handleReturnDateChange}
              />
            </div>
          )}

          <div className="priceDiv">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <button className="btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      {showPopup && <Popup message={message} onClose={handleClosePopup} />}
    </section>
  );
};

export default Home;
