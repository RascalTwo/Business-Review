import React from 'react';
import { businessShape } from '../proptypes';

class Business extends React.Component {
  render() {
    return (
      <div id="business">
        <div className="container">
          <p>Business {this.props.id} loaded, this is a placholder.</p>
        </div>
      </div>
    );
  }
}

Business.propTypes = businessShape.isRequired;

export default Business;
