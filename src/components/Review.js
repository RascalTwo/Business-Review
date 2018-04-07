import React from 'react';

class Review extends React.Component {
  render() {
    return (
      <div id="review">
        <div className="container">
          {/* eslint-disable-next-line */}
          <p>Review {this.props.match.params.reviewId} loaded, this is a placholder.</p>
        </div>
      </div>
    );
  }
}

export default Review;
