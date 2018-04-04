const fs = require('fs');
const sqlite = require('sqlite');

/**
 * @typedef {Object} API_Response Response from an API endpoint.
 * @prop {Boolean} success If the request was successful.
 * @prop {Array<String>} message A message and the level of the message.
 * @prop {any} data Data to pass to the client.
 */

module.exports = class Database {
  /**
   * Create a instance of the database manager.
   *
   * @param {any} server Server instance.
   */
  constructor(server) {
    this.server = server;

    this.db = null;
  }

  /**
   * Initalize the database connection.
   */
  init() {
    return sqlite
      .open(`${this.server.paths.data}/database.db`, { Promise })
      .then((db) => {
        const schema = fs.readFileSync(`${this.server.paths.root}/server/schema.sql`).toString();
        return db.exec(schema);
      })
      .then((db) => {
        this.db = db;
      });
  }


  /**
   * Append reviews to the given business objects.
   *
   * @param {Array<Object>} businesses Businesses to append reviews to.
   *
   * @returns {Promise<Array<Object>>} Businesses with reviews appended.
   */
  async appendReviews(businesses) {
    const reviews = await this.db.all('SELECT * FROM review ORDER BY date DESC;');
    const users = await this.db.all('SELECT * FROM user;');

    const userMap = users.reduce((map, user) => {
      Object.assign(user, {
        reviews: []
      });
      return Object.assign(map, {
        [user.id]: user
      });
    }, {});

    const businessMap = businesses.reduce((map, business) => {
      Object.assign(business, {
        reviews: []
      });
      return Object.assign(map, {
        [business.id]: business
      });
    }, {});

    reviews.forEach((review) => {
      Object.assign(review, {
        business: businessMap[review.businessId]
      });
      businessMap[review.businessId].reviews.push(review);

      if (userMap[review.userId]) {
        Object.assign(review, {
          user: userMap[review.userId]
        });
        userMap[review.userId].reviews.push(review);
        return;
      }
      Object.assign(review, {
        user: null
      });
    });

    return businesses;
  }


  /**
   * Append photos to the provided businessed.
   *
   * @param {Array<Object>} businesses Businesses to append photos to.
   *
   * @returns {Promise<Array<Object>>} Businesses with photos appended.
   */
  async appendPhotos(businesses) {
    const photos = await this.db.all('SELECT * FROM photo ORDER BY position ASC;');

    const businessMap = businesses.reduce((map, business) => {
      Object.assign(business, {
        photos: []
      });
      return Object.assign(map, {
        [business.id]: business
      });
    }, {});

    return photos.map((photo) => {
      Object.assign(photo, {
        business: businessMap[photo.businessId]
      });
      businessMap[photo.businessId].photos.push(photo);

      return photo;
    });
  }


  /**
   * Get the payload from the server.
   */
  async getPayload() {
    const businesses = await this.db.all('SELECT * FROM business;');
    await this.appendReviews(businesses);
    await this.appendPhotos(businesses);
    return businesses.map((business) => {
      if (business.purchased === null) {
        Object.assign(business, {
          purchased: false
        });
      }
      return business;
    });
  }


  /**
   * Attempt to add a business to the database.
   *
   * @param {String} name
   * @param {String} [type=undefined]
   * @param {String} address Street address
   * @param {String} city
   * @param {String} state Either full or two-character state code.
   * @param {String} postalCode
   *
   * @returns {Promise<API_Response>}
   */
  addBusiness(name, type, address, city, state, postalCode) {
    return this.db.get(
      'SELECT * FROM business WHERE name = ? AND address = ? AND city = ? AND state = ? AND postalCode = ?;',
      name, address, city, state, postalCode
    ).then((found) => {
      if (found) {
        return {
          success: false,
          message: ['Business with that information already exists', 'warn'],
          data: Object.assign(found, {
            purchased: found.purchased !== null
          })
        };
      }

      return this.db.run(
        'INSERT INTO business (name, type, address, city, state, postalCode) VALUES (?, ?, ?, ?, ?, ?);',
        name, type, address, city, state, postalCode
      ).then(result => ({
        success: true,
        message: ['Business successfully added', 'success'],
        data: {
          id: result.lastID,
          name,
          type,
          address,
          city,
          state,
          postalCode,
          purchased: false
        }
      }));
    });
  }


  /**
   * Attempt to add a review to a business.
   *
   * @param {Number} businessId ID of businessing to review.
   * @param {Number} userId ID of the user making the review.
   * @param {Number} score Score of the review.
   * @param {String} text Text content of the review.
   *
   * @returns {Promise<API_Response>}
   */
  addReview(businessId, userId, score, text) {
    const now = Date.now();
    return this.db.get('SELECT * FROM business WHERE id = ?', businessId).then((found) => {
      if (!found) {
        return {
          success: false,
          message: ['Business not found', 'error']
        };
      }

      return this.db.run(
        'INSERT INTO review (businessId, userId, score, date, text) VALUES (?, ?, ?, ?, ?);',
        businessId, userId, score, now, text
      ).then(result => ({
        success: true,
        message: ['Review successfully added', 'success'],
        data: {
          id: result.lastID,
          businessId,
          userId,
          score,
          date: now,
          text
        }
      }));
    });
  }


  /**
   * Delete a business by ID.
   *
   * Also deletes all photo and reviews related to said business.
   *
   * @param {String} id ID of business to delete.
   *
   * @returns {Promise<API_Response>}
   */
  deleteBusiness(id) {
    return this.db.run('DELETE FROM business WHERE id = ?;', id).then((result) => {
      if (!result.changes) {
        return {
          success: false,
          message: ['Business not found', 'warn']
        };
      }
      return this.db.run('DELETE FROM review WHERE businessId = ?', id)
        .then(() => this.db.run('DELETE FROM photo WHERE businessId = ?', id))
        .then(() => ({
          success: true,
          message: ['Business successfully deleted', 'success']
        }));
    });
  }


  /**
   * Delete a review by ID.
   *
   * @param {String} id ID of review to delete.
   *
   * @returns {Promise<API_Response>}
   */
  deleteReview(id) {
    return this.db.run('DELETE FROM review WHERE id = ?;', id).then((result) => {
      if (!result.changes) {
        return {
          success: false,
          message: ['Review not found', 'warn']
        };
      }
      return {
        success: true,
        message: ['Review successfully deleted', 'success']
      };
    });
  }
};
