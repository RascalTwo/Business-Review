import React, { Component } from 'react';
import logo from './logo.svg';
import './app.css';

class App extends Component {
  /**
   * Create an instance of the App.
   */
  constructor() {
    super();

    this.state = {
      apiTime: null
    };
  }

  /**
   * Set the time from the API when the app mounts.
   */
  componentDidMount() {
    return this.updateTime();
  }

  /**
   * Update 'state.apiTime' from the API.
   */
  updateTime() {
    return fetch('/api')
      .then(r => r.json())
      .then((response) => {
        this.setState({
          apiTime: response.timestamp
        });
      });
  }

  /**
   * Render the component.
   */
  render() {
    return (
      <div id="app">
        <img src={logo} id="logo" alt="logo" />
        <div>{new Date(this.state.apiTime).toString()}</div>
        <button onClick={() => this.updateTime()}>Update Time</button>
      </div>
    );
  }
}

export default App;
