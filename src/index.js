import React from 'react';
import ReactDOM from 'react-dom';
import Payload from './payload';
import App from './components/App';

ReactDOM.render(<App payload={Payload} />, document.getElementById('react-root'));
