import React from 'react';
import Header from './Header';
import Footer from './Footer';

const NotFound = () => (
  <div id="not-found">
    <Header />
    <div className="container">
      <p>Pague not found. Click <a href="/">here</a> to get back.</p>
    </div>
    <Footer />
  </div>
);

export default NotFound;
