import React from 'react';
import './Header.css';
import logo from './logo.svg';

const Header = () => (
  <header className="main-header">
    <div className="container">
      <nav>
        <ul className="main-nav">
          <img src={logo} id="logo" alt="logo" />
          <li><a href="#home">Home</a></li>
          <li><a href="#explore">Explore</a></li>
          <li><a href="#about">About</a></li>
        </ul>
      </nav>
    </div>
  </header>
);

export default Header;
