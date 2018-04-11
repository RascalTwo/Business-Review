import React from 'react';
import { Link } from 'react-router-dom';
import '../static/Header.css';

const Header = () => (
  <header id="main-header">
    <ul className="main-nav">
      <li>
        <Link to="/">Home</Link>
      </li>
      <li>
        <Link to="#contact">Contact</Link>
      </li>
      <li>
        <Link to="#signin">Sign in</Link>
      </li>
    </ul>
  </header>
);

export default Header;
