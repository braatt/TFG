import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdOutlineTravelExplore } from "react-icons/md";
import { jwtDecode } from 'jwt-decode';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const fetchUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token); 
        setUser(decoded); 
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        setUser(null);
      }
    } else {
      setUser(null); 
    }
  };

  useEffect(() => {
    fetchUserFromToken();
  }, []); 

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    setUser(null); 
    navigate('/');
  };

  return (
    <section className="navBarSection">
      <div className="header">
        <div className="logoDiv">
          <Link to="/" className="logo">
            <h1 className="flex">
              <MdOutlineTravelExplore className="icon" />
              FlightNots
            </h1>
          </Link>
        </div>

        <div className="navBar">
          <ul className="navLists flex">
            
          </ul>

          <div className="headerBtns flex">
            {user ? (
              <>
                <span className="user-info">Hi, {user.firstName}</span>
                <button onClick={handleLogout} className="btn logoutBtn">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn loginBtn">Login</Link>
                <Link to="/signup" className="btn signupBtn">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Navbar;
