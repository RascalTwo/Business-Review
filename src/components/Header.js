import React from 'react';
import { Link } from 'react-router-dom';
import '../static/Header.css';

const Header = () => (
  <header className="main-header">
    <div className="container">
      <nav>
        <ul className="main-nav">
          <li><Link to="/">Home</Link></li>
          <li><Link to="#contact">Contact</Link></li>
        </ul>
      </nav>
    </div>
  </header>
);

export default Header;
