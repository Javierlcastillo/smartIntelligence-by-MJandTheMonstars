import React, { useState } from "react";
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="header">
          <Link to="/" className="header-logo-link">
              <h1 id="GateGroup-head"><b>gate</b>group</h1>
          </Link>
          <button 
            className={`burger-menu ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
          >
              <span></span>
              <span></span>
              <span></span>
          </button>
      </header>
      
      {/* Sliding Menu */}
      <div className={`slide-menu ${isMenuOpen ? 'open' : ''}`}>
        <nav className="slide-menu-nav">
          <Link to="/dashboard" className="menu-item" onClick={closeMenu}>
            Inventory
          </Link>
          <Link to="/flights" className="menu-item" onClick={closeMenu}>
            Flights
          </Link>
          <Link to="/reports" className="menu-item" onClick={closeMenu}>
            Reports
          </Link>
          <Link to="/settings" className="menu-item" onClick={closeMenu}>
            Settings
          </Link>
        </nav>
      </div>
      
      {/* Overlay */}
      {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
    </>
  );
}

export default Header;