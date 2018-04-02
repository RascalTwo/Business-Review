const fs = require('fs');
const path = require('path');

const CircularJSON = require('circular-json');

module.exports = (Server) => {
  Server.app.get('/api', (_, response) => response.send({
    timestamp: Date.now()
  }));

  Server.app.get('/', (_, response) => Server.db.getPayload().then((payload) => {
    const html = fs.readFileSync(path.join(Server.paths.root, 'build', 'index.html')).toString();
    response.send(html.replace(
      'payload=false',
      `payload=${CircularJSON.stringify(payload)}`
    ));
  }).catch((error) => {
    response.status(500).send(error);
  }));
};
