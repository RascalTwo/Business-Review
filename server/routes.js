const path = require('path');

module.exports = (Server) => {
  Server.app.get('/api', (_, response) =>
    response.send({
      timestamp: Date.now()
    }));

  Server.app.get('/', (_, response) => {
    response.sendFile(path.join(Server.root, 'build', 'index.html'));
  });
};
