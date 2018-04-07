import React from 'react';

class Business extends React.Component {
  render() {
    return (
      <div id="business">
        <div className="container">
          {/* eslint-disable-next-line */}
          <p>Business {this.props.match.params.businessId} loaded, this is a placholder.</p>
        </div>
      </div>
    );
  }
}

export default Business;
