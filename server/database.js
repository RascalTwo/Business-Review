const fs = require('fs');
const sqlite = require('sqlite');

module.exports = class Database {
  /**
   * Create a instance of the database manager.
   *
   * @param {any} server Server instance.
   */
  constructor(server) {
    this.root = server.root;

    this.db = null;
  }

  /**
   * Initalize the database connection.
   */
  init() {
    return sqlite
      .open(`${this.root}/data/database.db`, { Promise })
      .then((db) => {
        const schema = fs.readFileSync(`${this.root}/server/schema.sql`).toString();
        return db.exec(schema);
      })
      .then((db) => {
        this.db = db;
      });
  }
};
