import React, { Component } from 'react';
import PropTypes from 'prop-types';
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

// PropType structure for payload.
const photoShape = PropTypes.shape({
  id: PropTypes.number,
  business_id: PropTypes.number,
  position: PropTypes.number,
  caption: PropTypes.string,
  business: () => businessShape // eslint-disable-line
});

const userShape = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
  password_hash: PropTypes.string,
  reviews: PropTypes.arrayOf(() => reviewShape) // eslint-disable-line
});

const reviewShape = PropTypes.shape({
  id: PropTypes.number,
  business_id: PropTypes.number,
  user_id: PropTypes.number,
  score: PropTypes.number,
  date: PropTypes.number,
  text: PropTypes.string,
  business: () => businessShape, // eslint-disable-line
  user: userShape
});

const businessShape = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string,
  type: PropTypes.string,
  address: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  postal_code: PropTypes.string,
  purchased: PropTypes.bool,
  reviews: PropTypes.arrayOf(reviewShape),
  photos: PropTypes.arrayOf(photoShape)
});

export default Home;
