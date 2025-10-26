import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';


function LandingPage() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>Smart-Intelligence</h1>
        <p>Plataforma de Gestión de Inventarios para GateGroup</p>
      </header>
      <nav className="landing-nav">
        <Link to="/pallet" className="nav-button">
          Llenado de Pallet
        </Link>
        <Link to="/scanner" className="nav-button">
          Escaner de Items
        </Link>
        <Link to="/dashboard" className="nav-button">
          Dashboard
        </Link>
      </nav>
    </div>
  );
}

export default LandingPage;
