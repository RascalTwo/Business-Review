import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import '../static/Home.css';

class Home extends Component {
  /**
   * Create an instance of the App.
   */
  constructor(props, context) {
    super(props, context);

    this.state = {
      apiSuccess: null
    };
  }

  /**
   * Set the time from the API when the app mounts.
   */
  componentDidMount() {
    return this.updateTime();
  }

  /**
   * Update 'state.apiTime' from the API.
   */
  updateTime() {
    return fetch('/api')
      .then(r => r.json())
      .then(response =>
        this.setState({
          apiSuccess: true
        }))
      .catch(() =>
        this.setState({
          apiSuccess: false
        }));
  }

  /**
   * Render the component.
   */
  render() {
    return (
      <div id="home">
        <div className="container">
          <div className="home-content">
            <div className="intro">
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque
                perspiciatis impedit delectus aspernatur sint distinctio.
              </p>
              <div
                className={`api-test ${this.state.apiSuccess ? 'up' : 'down'}`}
              >
                <div className="spinner">
                  <div className="double-bounce1" />
                </div>
              </div>
            </div>
            <div className="browse-reviews">
              <h2>Reviews</h2>
              <p>
                Eaque excepturi, cum laborum eveniet doloribus ducimus sed,
                adipisci id accusantium, earum vel impedit. Lorem ipsum dolor,
                sit amet consectetur adipisicing elit. Ipsum ex velit officia
                aspernatur consequuntur? Doloremque, laudantium.
              </p>
              <Link to="/reviews" className="browse-button">
                Browse Reviews
              </Link>
            </div>
            <div className="browse-places">
              <h2>Places</h2>
              <p>
                Eaque excepturi, cum laborum eveniet doloribus ducimus sed,
                adipisci id accusantium, earum vel impedit. Lorem ipsum dolor,
                sit amet consectetur adipisicing elit. Ipsum ex velit officia
                aspernatur consequuntur? Doloremque, laudantium.
              </p>
              <Link to="/businesses" className="browse-button">
                Browse Places
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
