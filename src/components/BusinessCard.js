import React from 'react';
import { Link } from 'react-router-dom';
import '../static/BusinessCard.css';
import { businessShape } from '../proptypes';
import { businessAverageScore } from '../helpers';

class BusinessCard extends React.Component {
  render() {
    const [business] = [this.props.business];
    return (
      <div className="business-card">
        {business.photos.length !== 0 && (
          <img
            className="business-photo"
            src={`../business_photos/${business.photos[0].id}.jpg`}
            alt={`${business.photos[0].caption} - ${business.name}`}
          />
        )}
        <h2 className="business-heading">
          <Link to={`/business/${business.id}`}>{business.name}</Link>
          <p />
        </h2>
        <div>
          <span className="business-score">
            {businessAverageScore(business)}
          </span>
        </div>
      </div>
    );
  }
}

BusinessCard.propTypes = businessShape.isRequired;

export default BusinessCard;
