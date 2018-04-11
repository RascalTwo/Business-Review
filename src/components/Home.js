import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import '../static/Home.css';
import pinIcon from '../static/pin_icon.svg';
import promoteIcon from '../static/promote.svg';

class Home extends Component {
  render() {
    return (
      <div id="home">
        <div className="home-first-section">
          <div className="container">
            <div className="intro">
              <h1 className="home-title">Business Review</h1>
              <div className="intro-card">
                <div className="illustration">
                  <img src={pinIcon} alt="" className="pin-icon" />
                  <p>
                    Write a review for a local store <br /> or find your new
                    favorite restaurant.
                  </p>
                </div>
                <div className="text">
                  <h3>Lorem ipsum dolor sit.</h3>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Totam, aliquid.
                  </p>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Nemo, laudantium iure.
                  </p>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Nemo, laudantium iure.
                  </p>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  </p>
                </div>
              </div>
            </div>
            <Link to="/businesses" className="browse-button">
              Browse Places
            </Link>
          </div>
        </div>
        <div className="home-second-section">
          <div className="container">
            <div className="promote">
              <img src={promoteIcon} alt="" className="promote-icon" />
              <p>
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Nulla
                odio eos officiis quisquam cum porro voluptates blanditiis
                obcaecati, alias itaque reiciendis corporis officia animi
                voluptatum vitae? Tempore officia aperiam quae.{' '}
                <Link to="/promote">Get started</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
