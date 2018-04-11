import React from 'react';
import { PropTypes, businessShape } from '../proptypes';
import BusinessCard from './BusinessCard';
import '../static/Businesses.css';

class Businesses extends React.Component {
  render() {
    return (
      <div id="businesses">
        <div className="container">
          <div className="businesses">
            {this.props.items.map(business => (
              <BusinessCard business={business} />
            ))}
          </div>
        </div>
      </div>
    );
  }
}

Businesses.propTypes = {
  items: PropTypes.arrayOf(businessShape).isRequired
};

export default Businesses;
