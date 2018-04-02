import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CircularJSON from 'circular-json';
import Header from './Header';
import Footer from './Footer';
import './app.css';

class App extends Component {
  /**
   * Create an instance of the App.
   */
  constructor(props, context) {
    super(props, context);

    this.state = {
      apiTime: null,
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
          apiTime: response.timestamp,
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
    const photos = this.props.payload[0]
      ? this.props.payload[0].photos.map(photo => (
        <img
          key={photo.id}
          src={this.props.photoMap[`${photo.id}.jpg`]}
          alt={photo.caption}
          title={photo.caption}
        />
      ))
      : false;

    return (
      <div id="app">
        <Header />
        <div className="container">
          <div className="home-content">
            <div className="intro">
              <div style={{ backgroundColor: (this.state.apiSuccess ? 'green' : 'red'), color: 'white' }}>{new Date(this.state.apiTime).toString()}</div>
              <button onClick={() => this.updateTime()}>Update Time</button>
              {/* <pre style={{ textAlign: 'left' }}>{CircularJSON.stringify(this.props.payload, null, '  ')}</pre>
              {photos} */}
              <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque perspiciatis impedit delectus aspernatur sint distinctio.
              </p>
            </div>
            <div className="browse-reviews">
              <h2>Reviews</h2>
              <p>
                Eaque excepturi, cum laborum eveniet doloribus ducimus sed, adipisci id accusantium, earum vel impedit.
                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                Ipsum ex velit officia aspernatur consequuntur? Doloremque, laudantium.
              </p>
              <a href="#reviews" className="browse-button">Browse Reviews</a>
            </div>
            <div className="browse-places">
              <h2>Places</h2>
              <p>
                Eaque excepturi, cum laborum eveniet doloribus ducimus sed, adipisci id accusantium, earum vel impedit.
                Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                Ipsum ex velit officia aspernatur consequuntur? Doloremque, laudantium.
              </p>
              <a href="#businesses" className="browse-button">Browse Places</a>
            </div>
          </div>
        </div>
        <Footer />
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

App.propTypes = {
  payload: PropTypes.arrayOf(businessShape).isRequired,
  photoMap: PropTypes.objectOf(String).isRequired
};

export default App;
