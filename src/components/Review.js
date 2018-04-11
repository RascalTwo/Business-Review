import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { reviewShape } from '../proptypes';
import '../static/Review.css';

class Review extends React.Component {
  render() {
    return (
      <div id="review">
        <div className="container">
          <h1 className="review-heading">
            <Link to={`/user/${this.props.user.id}`}>
              {this.props.user.username}
            </Link>
            {"'s review of "}
            <a
              href={`business/${this.props.businessId}`}
              className="business-name"
            >
              {this.props.business.name}
            </a>
          </h1>
          <div>
            <span className="review-score">{this.props.score}/5</span>
            <span className="review-date">
              {moment(this.props.date).fromNow()}
            </span>
          </div>
          <p className="review-text">{this.props.text}</p>
        </div>
      </div>
    );
  }
}

Review.propTypes = reviewShape.isRequired;

export default Review;
