import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import landingPicture from './landingPicture.jpg';

function LandingPage() {
  return (
    <>
      <div className="hero-section">
        <img src={landingPicture} alt="Airline catering service" className="hero-image"/>
        <div className="airline-banner">
          <div className="airline-logos">
            <span>Lufthansa</span>
            <span>SWISS</span>
            <span>United</span>
            <span>American</span>
            <span>Delta</span>
            {/* Duplicate for seamless scroll */}
            <span>Lufthansa</span>
            <span>SWISS</span>
            <span>United</span>
            <span>American</span>
            <span>Delta</span>
          </div>
        </div>
      </div>
      <div className="landing-container">
        <header className="landing-header">
          <h1>Inventory Management System</h1>
          <p>Plataforma de Gestión de Inventarios para GateGroup</p>
        </header>

        {/* Navigation for Desktop (hidden on mobile) */}
        <nav className="landing-nav-desktop">
          <Link to="/pallet" className="nav-button">
            Llenado de Pallet
          </Link>
          <Link to="/scanner" className="nav-button" id='scan-item'>
            Escaner de Items
          </Link>
          <Link to="/dashboard" className="nav-button">
            Dashboard
          </Link>
        </nav>

        {/* Homebar for Mobile (hidden on desktop) */}
        <nav className="homebar-mobile">
          <Link to="/pallet" className="homebar-button">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <span>Pallet</span>
          </Link>
          <Link to="/scanner" className="homebar-button">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><line x1="14" y1="14" x2="14" y2="14.01"></line><line x1="17.5" y1="14" x2="17.5" y2="14.01"></line><line x1="14" y1="17.5" x2="14" y2="17.5.01"></line><line x1="21" y1="17.5" x2="21" y2="17.5.01"></line><line x1="17.5" y1="17.5" x2="17.5" y2="17.5.01"></line><line x1="21" y1="21" x2="21" y2="21.01"></line><line x1="14" y1="21" x2="14" y2="21.01"></line><line x1="17.5" y1="21" x2="17.5" y2="21.01"></line><line x1="21" y1="14" x2="21" y2="14.01"></line>
            </svg>
            <span>Escaner</span>
          </Link>
        </nav>
      </div>
    </>
  );
}

export default LandingPage;
