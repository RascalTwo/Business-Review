import React from 'react';
import { reviewShape } from '../proptypes';

class Review extends React.Component {
  render() {
    return (
      <div id="review">
        <div className="container">
          <p>Review {this.props.id} loaded, this is a placholder.</p>
        </div>
      </div>
    );
  }
}

Review.propTypes = reviewShape.isRequired;

export default Review;
