import React from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { reviewShape } from '../proptypes';
import '../static/ReviewCard.css';

class ReviewCard extends React.Component {
  render() {
    const maxReviewLength = 50;
    return (
      <div className="review-card">
        <h2 className="review-heading">
          <Link to={`/user/${this.props.review.user.id}`}>
            {this.props.review.user.username}
          </Link>
          {"'s review of "}
          <a
            href={`business/${this.props.review.businessId}`}
            className="business-name"
          >
            {this.props.review.business.name}
          </a>
        </h2>
        <div>
          <span className="review-score">{this.props.review.score}/5</span>
          <span className="review-date">
            {moment(this.props.review.date).fromNow()}
          </span>
        </div>
        <p className="review-text">
          {this.props.review.text.length <= maxReviewLength ? (
            this.props.review.text
          ) : (
            <span>
              {`${this.props.review.text.substring(0, maxReviewLength)}...`}
              <Link
                to={`/review/${this.props.review.id}`}
                className="read-more"
              >
                More
              </Link>
            </span>
          )}
        </p>
      </div>
    );
  }
}

ReviewCard.propTypes = reviewShape.isRequired;

export default ReviewCard;
