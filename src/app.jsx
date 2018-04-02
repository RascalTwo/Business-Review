import React, { Component } from 'react';
import PropTypes from 'prop-types';
import CircularJSON from 'circular-json';
import Header from './Header';
import './app.css';

/**
 * Map expected and generated filepaths for files in context.
 *
 * @returns {Object} Mapped filepaths.
 */
function mapFiles(context) {
  return context.keys().reduce((images, filepath) => {
    Object.assign(images, {
      [filepath.replace('./', '')]: context(filepath)
    });
    return images;
  }, {});
}

const images = mapFiles(require.context('./business_photos', false, /\.(png|jpe?g|svg)$/));

class App extends Component {
  /**
   * Create an instance of the App.
   */
  constructor(props, context) {
    super(props, context);

    this.state = {
      apiTime: null
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
      .then((response) => {
        this.setState({
          apiTime: response.timestamp
        });
      });
  }

  /**
   * Render the component.
   */
  render() {
    const photos = this.props.payload[0]
      ? this.props.payload[0].photos.map(photo => (
        <img
          key={photo.id}
          src={images[`${photo.id}.jpg`]}
          alt={photo.caption}
          title={photo.caption}
        />
      ))
      : false;

    return (
      <div id="app">
        <Header />
        <div>
          <div>{new Date(this.state.apiTime).toString()}</div>
          <button onClick={() => this.updateTime()}>Update Time</button>
          <p>Payload:</p>
          <pre style={{ textAlign: 'left' }}>
            {CircularJSON.stringify(this.props.payload, null, '  ')}
          </pre>
          <p>Photos</p>
          {photos}
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

App.propTypes = {
  payload: PropTypes.arrayOf(businessShape).isRequired
};

export default App;
