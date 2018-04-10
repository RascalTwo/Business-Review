const fs = require('fs');
const path = require('path');

const express = require('express');
const morgan = require('morgan');

const multer = require('multer');

const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const SessionFileStore = require('session-file-store')(expressSession);

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const CircularJSON = require('circular-json');

const routes = require('./server/routes.js');
const Database = require('./server/database.js');

class Server {
  /**
   * Create a instance of the Server.
   *
   * @param {Number} [port=undefined] Port to run on.
   * @param {Object} [paths={}] Paths for the server.
   */
  constructor(port, paths = {}) {
    this.port = port || process.env.PORT || 8080;
    this.root = __dirname;
    this.paths = Object.assign({
      data: `${__dirname}/data`,
      photos: `${__dirname}/src/business_photos`
    }, paths, {
      root: __dirname
    });

    this.app = null;
    this.db = null;
    this.httpServer = null;
    this.upload = multer({
      storage: multer.memoryStorage()
    });
  }

  /**
   * Initalize the express app and database.
   *
   * @returns {Promise<Server>} A promise with itself to allow for chaining.
   */
  init() {
    this.app = express();

    // Logging
    this.app.use(morgan('common'));

    // Handle application/json and formdata.
    this.app.use(express.json());
    this.app.use(express.urlencoded({
      extended: true,
    }));

    this.app.use(cookieParser('2776209b9d9d72eef92d0910e8c72e13'));
    this.app.use(expressSession({
      store: new SessionFileStore(),
      secret: '2776209b9d9d72eef92d0910e8c72e13',
      resave: true,
      saveUninitialized: false
    }));

    this.db = new Database(this);

    return this.db.init().then(() => {
      if (process.env.NODE_ENV === 'production') return Promise.resolve();
      return this.db.getBusinesses().then((businesses) => {
        fs.writeFileSync(path.resolve(__dirname, 'src', 'hot_data.json'), CircularJSON.stringify(businesses, null, '  '));
      });
    }).then(() => {
      passport.use(new LocalStrategy((username, password, done) => this.db.canLogin(username, password).then((result) => {
        if (result.success) return done(null, result.data);
        return done(null, false);
      }).catch(error => done(error, false))));

      passport.serializeUser((user, done) => done(null, user.id));

      passport.deserializeUser((id, done) => this.db.getUser(id).then((user) => {
        if (user) return done(null, user);
        return done(null, false);
      }).catch(error => done(error, false)));

      this.app.use(passport.initialize());
      this.app.use(passport.session());

      // Serve all requests to '/static/*' from the './build/static/' folder.
      this.app.use('/static', express.static(path.join(this.root, 'build', 'static')));

      routes(this);

      return this;
    });
  }

  /**
   * Start the server.
   *
   * @returns {Promise<Server>} A promise with itself to allow for chaining.
   */
  start() {
    return new Promise((resolve, reject) => {
      if (this.app === null) {
        reject(new Error('Must initalize server before starting'));
        return;
      }

      this.httpServer = this.app.listen(this.port, () => {
        console.log(`Listening on port ${this.port}`);
        return resolve(this);
      }).on('error', error => reject(error));
    });
  }

  /**
   * Stop the server.
   *
   * @returns {Promise<Server>} A promise with itself to allow for chaining.
   */
  stop() {
    return new Promise((resolve) => {
      if (!this.httpServer) return resolve(this);
      return this.httpServer.close(() => resolve(this));
    });
  }
}


/**
 * Either start the server or return it to be used in tests.
 */
function run() {
  if (require.main !== module) return Server;

  return new Server(parseInt(process.argv[2], 10) || parseInt(process.env.PORT, 10) || 8080)
    .init()
    .then(instance => instance.start())
    .catch(console.error);
}

module.exports = run;
run();
