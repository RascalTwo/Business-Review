import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Payload from './payload';
import photoMap from './photoMap';
import App from './app';

ReactDOM.render(<App payload={Payload} photoMap={photoMap} />, document.getElementById('react-root'));
