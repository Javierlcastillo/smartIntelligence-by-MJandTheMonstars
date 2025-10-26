import React from "react";
import './Header.css';

function Header() {
  return (
    <header className="header">
        <h1 id="GateGroup-head"><b>gate</b>group</h1>
        <button className="burger-menu">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </header>
  );
}

export default Header;