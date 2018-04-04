import React from 'react';
import Header from './Header';
import Footer from './Footer';

class Business extends React.Component {
  render() {
    return (
      <div id="business">
        <Header />
        <div className="container">
          <p>Business {this.props.match.params.businessId} loaded, this is a placholder.</p>
        </div>
        <Footer />
      </div>
    );
  }
}

export default Business;
