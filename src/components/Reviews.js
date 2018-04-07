import React from 'react';
import { PropTypes, reviewShape } from '../proptypes';
import '../static/Reviews.css';

class Reviews extends React.Component {
  render() {
    return (
      <div id="reviews">
        <div className="container">
          <p>{this.props.items.length} Reviews loaded, this is a placholder.</p>
        </div>
      </div>
    );
  }
}

Reviews.propTypes = {
  items: PropTypes.arrayOf(reviewShape).isRequired
};

export default Reviews;
