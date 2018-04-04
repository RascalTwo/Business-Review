import React from 'react';
import Header from './Header';
import Footer from './Footer';

class Business extends React.Component {
  render() {
    return (
      <div id="review">
        <Header />
        <div className="container">
          <p>Review {this.props.match.params.reviewId} loaded, this is a placholder.</p>
        </div>
        <Footer />
      </div>
    );
  }
}

export default Business;
