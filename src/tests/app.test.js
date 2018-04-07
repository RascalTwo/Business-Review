import fs from 'fs';
import React from 'react';
import ReactDOM from 'react-dom';
import App from '../components/App';

global.fetch = () => Promise.resolve({
  json: Promise.resolve({
    timestamp: Date.now()
  })
});

const photoMap = fs.readdirSync(`${__dirname}/../business_photos`).reduce((map, filename) => {
  if (filename.startsWith('.')) return map;

  return Object.assign(map, {
    [filename]: filename
  });
}, {});

it('renders without crashing', async () => {
  const div = document.createElement('div');
  ReactDOM.render(<App payload={[]} photoMap={photoMap} />, div);

  // Bad practice, but can't think of a way to wait for
  // componentWillMount to finish without installing another library.
  return setTimeout(() => ReactDOM.unmountComponentAtNode(div), 1000);
});
