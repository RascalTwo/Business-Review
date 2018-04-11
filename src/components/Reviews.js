import React from 'react';
import { PropTypes, reviewShape } from '../proptypes';
import ReviewCard from './ReviewCard';
import '../static/Reviews.css';

class Reviews extends React.Component {
  render() {
    return (
      <div id="reviews">
        <div className="container">
          <h1>Reviews</h1>
          <div className="reviews">
            {this.props.items.map(review => <ReviewCard review={review} />)}
          </div>
        </div>
      </div>
    );
  }
}

Reviews.propTypes = {
  items: PropTypes.arrayOf(reviewShape).isRequired
};

export default Reviews;
