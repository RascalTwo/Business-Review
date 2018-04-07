import PropTypes from 'prop-types';


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

export { photoShape, userShape, reviewShape, businessShape, PropTypes };
