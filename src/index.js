import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Payload from './payload';
import App from './app';

ReactDOM.render(<App payload={Payload} />, document.getElementById('react-root'));
