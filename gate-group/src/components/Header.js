import React from "react";
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="header">
        <Link to="/" className="header-logo-link">
            <h1 id="GateGroup-head"><b>gate</b>group</h1>
        </Link>
        <button className="burger-menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </header>
  );
}

export default Header;