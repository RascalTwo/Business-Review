import React from 'react';
import { PropTypes, businessShape } from '../proptypes';

class Businesses extends React.Component {
  render() {
    return (
      <div id="businesses">
        <div className="container">
          <p>{this.props.items.length} Businesses loaded, this is a placholder.</p>
        </div>
      </div>
    );
  }
}

Businesses.propTypes = {
  items: PropTypes.arrayOf(businessShape).isRequired
};

export default Businesses;
