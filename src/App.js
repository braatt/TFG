import React from 'react';
import './app.css';
import Home from './Components/Home/Home';
import Navbar from './Components/Navbar/Navbar';
import Login from './Components/Login/Login';
import Signup from './Components/Signup/Signup';
import SearchResults from './Components/SearchResults/SearchResults'; 
import FlightResults from './Components/FlightResults/FlightResults';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/search-results" element={<SearchResults />} /> {}
        <Route path="/flight-results" element={<FlightResults />} />

      </Routes>
    </Router>
  );
};

export default App;
